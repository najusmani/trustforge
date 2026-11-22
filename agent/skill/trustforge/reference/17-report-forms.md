# 17 Report Forms (BI Publisher)
- Reporting platforms: BIP and OBIEE; ODT designs the BIP report parameter screen (RTF + data template XDO assumed to exist).
- New, Function Category Report, 3rd char R. Only data source: `CSTB_UI_COLUMNS` (add as many columns as parameters, incl. generic ones).
- Generic params (Report Parameter checked, Visible unchecked): PM_MINOR, PM_BRANCH_CODE (default `GLOBAL.CURRENT_BRANCH`), PM_BRANCH_DATE (`GLOBAL.APPLICATION_DATE`), PM_BRANCH_DESC, PM_CURRENT_USER (`GLOBAL.USER_ID`), PM_LCY, PM_LANGUAGE, PM_MODULE.
- ODT auto-adds report options: Report Format, Report Output (Print/Spool/View), Print At (Client/Server), Printer ID.
- Generates AETB_FUNC_MASTER / AETB_FUNC_DETAIL INCs. RTF (layout) + XDO (queries) deployed to BIP server. Hook package: bind value derivation function `Afterpform` called on XDO load; helper functions used by XDO queries.

