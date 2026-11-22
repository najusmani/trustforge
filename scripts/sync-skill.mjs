// Copies the TrustForge plugin (../trustforge, the single source of truth) into agent/skill/trustforge,
// the skill the hosted agents use. Runs automatically before `dev`, before `build` and in the pre-commit hook.
//
// Differences from the plugin, applied here so nobody edits the copy by hand:
//   - agent/skill/trustforge/SKILL.md is the website's own entry point and is kept as is.
//   - Each skills/<name>/SKILL.md becomes GUIDE.md (Managed Agents allows one SKILL.md per skill),
//     and every "SKILL.md" mention inside the copied files becomes "GUIDE.md".
//   - Plugin-only parts (commands/, .claude-plugin/, README.md, CHANGELOG.md, caches) are not copied.
//
// When ../trustforge is absent (for example on Vercel, which only has this repo) it does nothing:
// the committed copy is used as is.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(web, "..", "trustforge");
const dst = path.join(web, "agent", "skill", "trustforge");
const COPY = ["reference", "skills"];
const SKIP = new Set(["__pycache__", ".DS_Store"]);
const TEXT = /\.(md|py|js|sql|json|xml|properties|txt)$/i;

if (!fs.existsSync(path.join(src, ".claude-plugin", "plugin.json"))) {
  console.log("[sync-skill] ../trustforge not found; using the committed agent/skill copy.");
  process.exit(0);
}

const want = new Map(); // relative destination path -> Buffer
function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.endsWith(".pyc")) continue;
    const full = path.join(dir, e.name);
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) walk(full, r);
    else if (e.isFile()) {
      let out = r.replace(/^skills\/([^/]+)\/SKILL\.md$/, "skills/$1/GUIDE.md");
      let buf = fs.readFileSync(full);
      if (TEXT.test(e.name)) buf = Buffer.from(buf.toString("utf8").replace(/SKILL\.md/g, "GUIDE.md"), "utf8");
      want.set(out, buf);
    }
  }
}
for (const top of COPY) walk(path.join(src, top), top);

let written = 0;
let removed = 0;
for (const [rel, buf] of want) {
  const target = path.join(dst, ...rel.split("/"));
  if (fs.existsSync(target) && fs.readFileSync(target).equals(buf)) continue;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buf);
  written++;
}
// Remove files the plugin no longer has (the website's own root SKILL.md stays).
function prune(dir, rel) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const r = rel ? path.posix.join(rel, e.name) : e.name;
    if (e.isDirectory()) {
      prune(full, r);
      if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    } else if (r !== "SKILL.md" && !want.has(r)) {
      fs.unlinkSync(full);
      removed++;
    }
  }
}
prune(dst, "");

const version = JSON.parse(fs.readFileSync(path.join(src, ".claude-plugin", "plugin.json"), "utf8")).version;
console.log(`[sync-skill] TrustForge ${version}: ${want.size} files, ${written} updated, ${removed} removed.`);
