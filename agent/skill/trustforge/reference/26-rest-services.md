# 26 REST Services Development
- End-to-end: (a) enable REST in radxml via ODT, (b) generate REST artifacts with Silent ODT, (c) build REST property files with Installer, (d) generate EXEC sources with Installer, (e) build EAR with Installer.
- Enable: Actions section -> Rest Enabled flag, Rest Service Name, tick action codes to expose; compile all generated INCs.
- Components: DTO files (request/response data transfer objects), Service file (performs actions), Util file, web.xml.
- Silent ODT for REST: JDK 1.8.0, Ant 1.7.1. SilentOdt.properties: OdtJdbcUrl / OdtDbUser / OdtDbPassword all encrypted, Logreqd, Logpath, Level (DEBUG/INFO/WARNING/SEVERE), JAVA_HOME, WEBLOGIC_HOME, WAS_HOME. Operations: LOGIN, SETRELEASE, REST_GENERATION (radxmlListFile or srcPath, gen=REST, destpath). Operation list now includes REST_GENERATION as 8th op.
