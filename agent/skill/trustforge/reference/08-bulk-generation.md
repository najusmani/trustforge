# 08 Bulk Generation (VERCON role)
- Generates front-end + back-end units for many radxmls; non-extensible radxmls: front-end only. No front-end for notification/purge radxmls.
- Source File List: text file of absolute radxml paths (e.g. `dir /b /s *_RAD.xml > list.txt`). Call forms used by listed screens MUST be in the list; prefix `--` to skip generating them but still load. Put call form list first.
- Destination Path (client or server per save mode; Zip not supported). Source Files: Extensible / Non-Extensible / Both. Data XML Path defunct.
- Outputs status log and missing-labels file per function id in destination.

