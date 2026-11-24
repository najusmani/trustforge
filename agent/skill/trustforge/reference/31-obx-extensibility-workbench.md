# 31 Oracle Banking Extensibility Workbench (OBX) 14.7 - installation and first-time setup

This file condenses Oracle's **OBX 14.7.0.0.0 Installation Guide** (June 2023,
docs.oracle.com/cd/F82829_01/PDF/Installation_Guide/InstallationGuide_OBX_14.7.0.0.0.pdf). Some steps are shown
only in screenshots in the guide; this file says so where that applies.

## 1. What OBX is (and how it differs from ODT)
- **OBX** generates and runs **extensions for products built on Oracle Banking Microservices Architecture
  (OBMA)**: new **services** (Java microservices, delivered as wars) and **web components** (UI).
- **ODT / RAD** (files 01-30) builds screens and PL/SQL / Java units for the **FLEXCUBE and OBPM** host framework
  (radxml, INCs, `<MOD>PKS_<FID>_*`).
- Use OBX only when the job is on an **OBMA (microservices) product**. The guide's example service war is
  `cmc-datasegment-services` (Common Core). For FCUBS / OBPM host screens, hooks and `PMTM_EXTENSION_CLASSES`
  hooks, stay with ODT (files 01-30).
- The guide assumes the **base product (kernel) is already set up**.
- Related Oracle documents: **OBX User Manual** (how to generate artifacts) and **OBX Release Notes**. The
  installation guide does not describe the generation commands; they are in the User Manual.

## 2. Prerequisites
- **Machine:** Windows 10 64-bit Pro, Enterprise or Education (build 15063 or later); 8-16 GB RAM. The introduction
  says 5 GB free, but the prerequisites list says **100 GB free**; plan for 100 GB.
- **Software:**
  - **Java JDK 8**;
  - **Cmder** console emulator (v1.3.21 recommended), used to run the `.sh` files on Windows;
  - Visual Studio Code or another IDE;
  - Postman;
  - Chrome or Firefox;
  - SQL Developer.
- **Bundled in the OBX zip:** Node.js **v18.12.1** (`node-v18.12.1-win-x64`) and Gradle. Do not install your own
  Node or Gradle; remove existing ones first.

## 3. Install steps (in order)
1. **Uninstall any existing Node.js and Gradle**, then restart the machine.
2. Create `C:\OBX`, and inside it `C:\OBX\OBX_setup`.
3. Extract `OBX-14.7.0.0.0.zip` into `C:\OBX\OBX_setup` (gives `C:\OBX\OBX_setup\OBX-14.7.0.0.0\`).
4. **Environment:** add the bundled Gradle and Node folders to the **System `Path`** and point it at the extracted
   OBX folder. The exact entries appear only in a screenshot; the Node folder is
   `C:\OBX\OBX_setup\OBX-14.7.0.0.0\node-v18.12.1-win-x64`.
5. Create `C:\Users\<user>\node_modules`.
6. Copy the **contents** of `...\node-v18.12.1-win-x64\node_modules\sass` into `C:\Users\<user>\node_modules`.
7. From `...\node-v18.12.1-win-x64\node_modules`, copy **every folder except `.bin`, `corepack`, `npm` and
   `sass`** into `C:\Users\<user>\node_modules`.
8. Save the settings and open Cmder (or a command prompt).
9. Create `C:\OBX\extension_home`, then go to it in the console.
10. **Check:** `obx -h` prints the OBX help menu. If it does not, the Path from step 4 is wrong.

## 4. First-time setup of `extension_home` (libraries from the base product)
Do this before generating the first artifact:
1. Create `extension_home\lib`.
2. Open any **base-product service war** with 7-Zip or similar (the guide's example is
   `cmc-datasegment-services.5.1.0.war`), go into `WEB-INF\lib`, and copy **all** its jars into `extension_home\lib`.
   Take them from the bank's own installed version, so the versions match.
3. Create `extension_home\runtime`.
4. From the **gradle** folder in the OBX zip, go into its `lib` folder and copy **`extra_jars`** (the compile-time
   dependencies for services) into `extension_home\runtime`.
5. To run artifacts locally you need the **component server**: get `component-server.zip` from the
   "shared location" (provided with the product delivery; the guide does not give a path) and extract it into
   `extension_home`.
6. The result should be `extension_home` containing `lib`, `runtime` and the extracted component-server folder.
   The guide shows the final layout only as a screenshot.

## 5. Working notes for TrustForge jobs
- Confirm the product first: OBX is for OBMA microservices products. Ask for the product name and version, and for
  the OBX User Manual pages, before writing OBX artifacts. They are not covered here.
- Version alignment: copy the `lib` jars from the same release as the target environment. A mismatch shows up as
  compile or runtime class errors in the generated service.
- Bank-specific items (the shared location, product wars, the bank's environment) stay out of the plugin. Record them
  only in the job's own notes.
