# Delivery - <FID> customization

## Files
| File | Purpose |
|---|---|

## Deployment steps
1. Run DDL: `db/ddl/...` (rollback: `db/ddl/..._rollback.sql`).
2. ODT: User Preferences -> release <REL> / env <ENV>. Function Generation -> Load `radxml/<FID>_RAD.xml` (or follow `odt-steps.md`). Visit each changed node, Save.
3. Generate: tick <UIXML, SYS JS, MAIN SPC/SQL, Menu, Label, LOV, Amend, Summary, Screen, Block, Data source, XSD ...>. Do NOT regenerate CUSTOM hook package if it already contains code.
4. Deploy front-end: `<FID>.xml` (UIXML), `<FID>_SYS.js`, `js/<FID>_CUSTOM.js`.
5. Compile in FLEXCUBE schema, in order: generated INCs -> `<mod>pks_<fid>_main.spc/.sql` -> `db/packages/<mod>pks_<fid>_custom.spc/.sql` -> `db/static/*.sql`. Check invalid objects = 0.
6. Clear app-server cache / restart if required by the environment; launch <FID>.

## Unit tests
| # | Req | Action | Input | Expected |
|---|---|---|---|---|

## Assumptions / open points
- 
