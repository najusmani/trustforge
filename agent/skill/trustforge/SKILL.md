---
name: trustforge
description: Oracle FLEXCUBE UBS 14.6/14.7 ODT (RAD Tool / Development Workbench) customization - new screens and radxml, CUSTOM-layer changes to Oracle KERNEL functions, radxml review against ODT load/save rules, CUSTOM hook packages and release JS, static data and DDL, Silent ODT configs, and ODT questions answered from Oracle's ODT guides. Use for any FLEXCUBE / ODT / radxml / RAD task.
---

# TrustForge: FLEXCUBE ODT customization

This skill folder holds everything needed for FLEXCUBE ODT work. Paths below are relative to this folder.

## Pick the guide for the job
| Job | Read first |
|---|---|
| Customize an existing function, or create a new screen (end to end) | `skills/odt-customize/SKILL.md` (it calls the others) |
| Design, edit or review a radxml | `skills/odt-radxml/SKILL.md` |
| CUSTOM hook package (`<MOD>PKS_<FID>_CUSTOM`) or release JS (`<FID>_CUSTOM.js`) | `skills/odt-hook-code/SKILL.md` |
| Labels, DDL, launch-form nodes, upload tables, error messages | `skills/odt-static-data/SKILL.md` |
| Silent ODT (bulk generation, refresh, SOAP/REST) | `skills/odt-silent/SKILL.md` |
| A question about ODT | `reference/INDEX.md`, then `reference/00-cheat-sheet.md`, then only the files INDEX.md points to |

Knowledge base: `reference/` (condensed from Oracle's ODT 14.7 guides; `27-radxml-format.md` and
`28-extending-kernel-function.md` are verified against real ODT saves on FCUBS 14.7.0.6.0).

## Scripts (Python 3, standard library only)
Run from this folder with `python3 -I`:
- `skills/odt-radxml/scripts/check_radxml.py <file>` - check a radxml against ODT load/save rules (merges layers like ODT)
- `skills/odt-radxml/scripts/radxml_merge.py <file>` - merge KERNEL/CLUSTER/CUSTOM like ODT; proves a CUSTOM delta changes no kernel value
- `skills/odt-radxml/scripts/gen_radxml.py <spec.json> <out.xml> [--release CODE]` - generate a NEW function's radxml from a JSON spec
- `skills/odt-radxml/scripts/make_skeleton.py` - rebuild the tag skeleton from other ODT saves

## Hosted-workspace conventions (these override the guides' file locations)
- The user's files are mounted read-only under `/mnt/session/uploads/`.
- Work in `/workspace/odt-work/<FID>/` (copy inputs to `input/`, build into `output/`).
- Every deliverable the user should download goes to `/mnt/session/outputs/` (keep the guides' output layout under it:
  `DESIGN.md`, `CHANGES.md`, `odt-steps.md`, `radxml/`, `db/`, `js/`, `silent/`).
- Use the release code (patch version) the user typed for every element you tag; never invent one.
- 14.7.0.6.0 is verified; for 14.6 or other 14.7 patches, say the output is a draft to confirm in ODT.
