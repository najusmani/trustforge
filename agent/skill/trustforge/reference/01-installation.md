# 01 Installation
- Run `FCUBSInstaller.bat` / `.sh` → installer GUI. Needs JAVA 8 home, Oracle client home, app server path.
- Choose "Property File creation" → component "Open Development Tool".
- Inputs: OS, app server, ODT JNDI, SYMMETRIC KEY = `oraclefinancials`, logger path, Provider_URL, WAR file name, source dir (must contain `rad_ddl.sql` + packages), destination dir, ODT schema (user, pwd, service name, TNS descriptor, IP, port), "DB Compilation Required" checkbox.
- Saves `env.properties` (ODT schema appended) + `odt.properties`; `ODT_PROPERTIES_PATH` written into env.properties. Copy env.properties from `INSTALLER\SOFT\GUI\logs` to `INSTALLER\SOFT\logs`.
- DB setup: `ODTDBCompileRun.bat/.sh` (DDL compile, object compile, static data). Invalid object count must be 0.
- WAR: `ODTWarRun.bat/.sh` → war in EAR destination path from env.properties.

