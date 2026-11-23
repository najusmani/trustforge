"""Static checks on a hand-written PL/SQL package body before it is compiled (lessons L6/L7 in
reference/29-lessons-learned.md). It does not replace the compiler; it catches mistakes that show up only at
compile time in the bank's environment, when TrustForge cannot compile.

Usage: python3 -I check_plsql_body.py <package_body.sql> [more files]

Checks:
  order   package-level variable/constant/type/cursor declarations after the first procedure or function body
          (PLS-00103 "Encountered the symbol ... when expecting begin end function pragma procedure")
  blocks  IF / END IF, LOOP / END LOOP, CASE / END CASE and parentheses balance per subprogram
  ends    every PROCEDURE/FUNCTION body that names itself at END uses the same name
  sqlfn   a function declared only in the body (not the spec) called inside a SQL statement (PLS-00231, lesson L7);
          the spec is read from a .spc/.pks file next to the body
Exit code 1 when an error is found.
"""
import re
import sys

SUB = re.compile(r"^\s*(PROCEDURE|FUNCTION)\s+([A-Z0-9_$#]+)", re.I)
DECL = re.compile(r"^\s*([A-Z][A-Z0-9_$#]*)\s+(CONSTANT\b|EXCEPTION\b|CURSOR\b|TYPE\b|SUBTYPE\b|"
                  r"[A-Z0-9_$#.]+(%ROWTYPE|%TYPE)|VARCHAR2|NUMBER|PLS_INTEGER|BINARY_INTEGER|BOOLEAN|DATE|CHAR|"
                  r"CLOB|INTEGER|TIMESTAMP|[A-Z0-9_$#]+\.[A-Z0-9_$#]+)", re.I)
TYPE_OR_CURSOR = re.compile(r"^\s*(TYPE|SUBTYPE|CURSOR)\s+[A-Z0-9_$#]+", re.I)


def strip(text):
    """Blank out comments and string literals, keeping line numbers."""
    out, i, n = [], 0, len(text)
    while i < n:
        if text.startswith("--", i):
            j = text.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append(re.sub(r"[^\n]", " ", text[i:j]))
            i = j
        elif text[i] == "'":
            j = i + 1
            while j < n:
                if text[j] == "'" and j + 1 < n and text[j + 1] == "'":
                    j += 2
                    continue
                if text[j] == "'":
                    break
                j += 1
            out.append("'" + re.sub(r"[^\n]", " ", text[i + 1:j]) + "'")
            i = j + 1
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def spec_functions(path, s):
    """Function names declared in the package spec: a sibling .spc/.pks file or a PACKAGE (not BODY) in the file."""
    import os
    texts = []
    stem = os.path.splitext(path)[0]
    for ext in (".spc", ".pks", ".SPC", ".PKS"):
        if os.path.exists(stem + ext):
            texts.append(strip(open(stem + ext, encoding="utf-8", errors="replace").read()))
    m = re.search(r"PACKAGE\s+(?!BODY\b)[A-Z0-9_$#.\"]+\s+(IS|AS)\b(.*?)\bEND\b", s, re.I | re.S)
    if m:
        texts.append(m.group(2))
    if not texts:
        return None
    return {n.upper() for t in texts for n in re.findall(r"\bFUNCTION\s+([A-Z0-9_$#]+)", t, re.I)}


def check_sql_private_functions(path, s):
    """PLS-00231: a function declared only in the package body cannot be called inside a SQL statement."""
    errs = []
    body_fns = {n.upper() for n in re.findall(r"^\s*FUNCTION\s+([A-Z0-9_$#]+)", s, re.I | re.M)}
    public = spec_functions(path, s)
    private = body_fns - (public or set())
    if not private:
        return errs
    for m in re.finditer(r"\b(INSERT\s+INTO|UPDATE\s+[A-Z0-9_$#.]+\s+SET|DELETE\s+FROM|MERGE\s+INTO|SELECT)\b[^;]*;",
                         s, re.I | re.S):
        stmt = m.group(0)
        for name in sorted(private):
            for u in re.finditer(rf"(?<![A-Z0-9_$#.]){re.escape(name)}\b", stmt, re.I):
                line = s.count("\n", 0, m.start() + u.start()) + 1
                note = "" if public is not None else " (no spec found: pass the .spc next to the body to confirm)"
                errs.append(f"{path}:{line}: [sqlfn] {name} is not in the package spec and is used inside a SQL "
                            f"statement (PLS-00231): assign it to a local variable before the statement{note}")
                break
    return errs


def check(path):
    errs = []
    raw = open(path, encoding="utf-8", errors="replace").read()
    s = strip(raw)
    lines = s.split("\n")
    # subprograms at package level: from header to matching END <name>; (or the next top-level header)
    depth_name = None
    seen_sub = False
    bodies = []  # (name, start, end)
    last_sig, last_no = "", 0  # last non-blank line (comments/strings blanked)
    for no, line in enumerate(lines, 1):
        u = line.upper()
        if depth_name is None:
            m = SUB.match(u)
            if m:
                depth_name = m.group(2)
                start = no
                seen_sub = True
                continue
            if re.match(r"^\s*(CREATE\s+OR\s+REPLACE\s+)?PACKAGE\s+BODY\b", u) or re.match(r"^\s*END\s*[A-Z0-9_$#]*\s*;\s*$", u):
                continue
            if seen_sub and (DECL.match(u) or TYPE_OR_CURSOR.match(u)) and not re.match(r"^\s*(BEGIN|END|IF|ELSE|ELSIF|RETURN|NULL)\b", u):
                errs.append(f"{path}:{no}: [order] package-level declaration after a procedure/function body "
                            f"(PLS-00103): move it above the first procedure/function -> {raw.split(chr(10))[no-1].strip()[:80]}")
        else:
            if re.match(rf"^\s*END\s+{re.escape(depth_name)}\s*;", u):
                bodies.append((depth_name, start, no))
                depth_name = None
            elif SUB.match(u) and re.match(r"^\s*END\s*;\s*$", last_sig):
                # previous subprogram closed with a bare "END;" (valid PL/SQL): close it, open this one
                bodies.append((depth_name, start, last_no))
                depth_name = SUB.match(u).group(2)
                start = no
        if u.strip():
            last_sig, last_no = u, no
    for name, a, b in bodies:
        seg = "\n".join(lines[a - 1:b]).upper()
        ifs = len(re.findall(r"(?<![A-Z0-9_$#])IF\b", seg)) - 2 * len(re.findall(r"\bEND\s+IF\b", seg))
        loops = len(re.findall(r"\bLOOP\b", seg)) - 2 * len(re.findall(r"\bEND\s+LOOP\b", seg))
        cases = len(re.findall(r"(?<![A-Z0-9_$#])CASE\b", seg)) - 2 * len(re.findall(r"\bEND\s+CASE\b", seg))
        par = seg.count("(") - seg.count(")")
        if ifs:
            errs.append(f"{path}:{a}: [blocks] {name}: {ifs:+d} IF without END IF")
        if loops:
            errs.append(f"{path}:{a}: [blocks] {name}: {loops:+d} LOOP without END LOOP")
        if par:
            errs.append(f"{path}:{a}: [blocks] {name}: parentheses unbalanced ({par:+d})")
        # CASE expressions end with END (not END CASE); only report a surplus of END CASE
        if cases < 0:
            errs.append(f"{path}:{a}: [blocks] {name}: END CASE without CASE")
    if depth_name is not None:
        errs.append(f"{path}:{start}: [ends] {depth_name}: no matching END {depth_name};")
    errs += check_sql_private_functions(path, s)
    print(f"{path}: {len(bodies)} subprograms checked, {len(errs)} error(s)")
    for e in errs:
        print("  ERROR", e)
    return errs


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    bad = [e for p in sys.argv[1:] for e in check(p)]
    sys.exit(1 if bad else 0)
