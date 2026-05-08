<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://www.mgm-tp.com/global-content/cd/logos/a12/app-icons/dark/A12-Dark.svg" />
  <img src="https://www.mgm-tp.com/global-content/cd/logos/a12/app-icons/light/A12-Light.svg" height="200" alt="A12 logo" />
</picture>

# Print Engine

The Print Engine is a Java library used to generate fully functional PDF-documents from unique A12 Models called Print Models. These describe the layout, styling and content of the resulting PDF-documents.

The Print Model Editor is a WYSIWYM (**W**hat **y**ou **s**ee is **w**hat **y**ou **m**ean) editor, designed around the insertion of dynamic content from the A12 Platform. Print Models can facilitate complex dynamic calculations and rule-based representations based on the inserted data.

Refer to https://geta12.com/#/docs to get started with A12 development.

---

## License

Parts of the A12 platform are made available under a **dual license**.  
Please check the [LICENSE](./LICENSE) file for details.

---

## Getting Started

### How to Use It

#### Import & Install

For importing and usage of the modules, check the official documentation on [GetA12](https://geta12.com/#/docs) under Development > Components > Engines > Print Engine. Alternatively you can access the instructions inside the [documentation](./documentation/) module.

### How to Build and Run

#### Prerequisites

The following tools are required in order to build this repository.

| Tool     |  Version |
| -------- | -------: |
| [JDK]    | `21.0.1` |
| [Gradle] | `8.12.1` |
| [Node]   | `22.14` |
| [pnpm]   | `10.4.1` |
| [Trivy]  | `Latest` |

> **Note**: Trivy is only required for the SBOM-generation of the Node.js modules.

---

#### How to Build

This repository uses [Gradle] as the leading build tool. The following tasks
can be executed in the repository root or in individual folders to build specific
modules.

The entire project can be built with:

```Shell
./gradlew assemble
```

The build process produces various artifacts. To get a fresh build use `./gradlew clean assemble` instead.

##### Building individual modules

Individual modules can be built with `./gradlew :<module-name>:assemble`, e.g.:

```bash
./gradlew :engine-runtime:assemble
```

For modules that feature frontend code (check [Package Documentation](#module-documentation)) it is possible to build their frontend code without rerunning the gradle build process, which can be useful for development. In this case you can use `pnpm compile`/`pnpm watch` instead.

Some Fullstack modules have frontend code that relies on the build steps of their backend code. In this case `./gradlew assemble` needs to run at least once before the front end code can be built separately:

-   engine-runtime-kernel
-   model-api
-   print-setting
-   typesetting

#### How to Test

The entire project can be tested using `./gradlew check` as this will execute all tests within each module.

You can also individually run the tests inside the modules using `./gradlew :<module-name>:check`.

In some cases you may only want to test frontend code, which can be done in the respective modules using `pnpm test`.


#### How to Run

##### Test App

The Print Engine Test App serves as a running Print Model Editor for development purposes.

The Test App can load so called use cases (defined by a case.config.json), that can showcase different configuration of elements in the Print Engine like Print Models, Print Setting Models and Typesetting Models.

To start the Test App:

```Shell
cd test-app
pnpm start
```

###### How to Access It

The Test App will run on http://localhost:9012 via a webpack server.

The Test App supports hot reloading for the frontend. If you want to enable hot reloading when working with other modules (e.g. model-editor-component), you need to run a separate process with `pnpm watch` for that respective module.

###### Testing via the Test App

The Test App tests are E2E tests that are executed via [Playwright]. They are not part of the overall project testing strategy. In order to run the test you'll need to install a special browser dependency:

```
pnpm run chromium
```

Afterwards the tests can be run:

```
pnpm run test
```

> WARNING: The [Playwright] tests use screenshot comparisons. As these are OS and potentially hardware dependent, we do not supply them in this repository. As such [Playwright] will fail upon first execution and create the screenshots on your system.

Check the package.json for additional options for running tests inside the Test App.

##### Print Shell

The print-shell is a CLI tool that allows you to access the printing process and some utility functionality.

To start the print-shell after building it:

```Shell
cd print-shell
java -jar build/libs/print-shell-<version>.jar
```

The print-shell will then allow you to run a limited set of commands;

-   migrate - migrates older Print Models to the current version of the print-shell
-   print - print/create a pdf based on a Print Model
-   compare - compare two PDFs with image comparisons

The migration that the print-shell provides is a legacy migration for Print Models <2.1.0. For newer print-models the [model-migration](./model-migration/) module provides the necessary tooling to migrate them.

Use `--help` on any command to display documentation about their usage and available options.

##### Codemod

The codemod provides automated scripts to help update your codebase when migrating to new versions of the Print Engine.

To run the codemod:

```bash
npx @com.mgmtp.a12.print/print-engine-codemod [recipe-id-or-version] [tsconfig-path]
```

The codemod package accepts the following parameters:

-   recipe-id-or-version - The ID of a specific recipe to run, or a target version to run all matching recipes
-   tsconfig-path - The path to your `tsconfig.json` file or a folder containing one

Use `--list` to see available recipes, or run without parameters for interactive prompts.

Example to replace deep-level imports with top-level imports:

```bash
npx @com.mgmtp.a12.print/print-engine-codemod prefer-top-level-imports ./tsconfig.json
```

---

### Publishing Packages

#### Generating SBOMs

##### Backend Component SBOMs

To generate a Software Bill of Materials (SBOM) for Backend Components, run the following command.

```bash
./gradlew cyclonedxDirectBom
```

The SBOM will be generated in JSON format at `./build/reports/sbom/cyclonedx.json` of each component directory.

##### Frontend Component SBOMs

For Frontend Components, this project uses Trivy to scan dependencies and generate SBOMs. Ensure that Trivy is installed and run the following command:

```bash
./gradlew generatePnpmSbom
```

The SBOM will be generated in JSON format at the root of each component directory `./cyclonedx.json`.

#### Publishing Artifacts

To publish Backend- and Frontend Component artifacts, use the `./gradlew publish` task. This task depends on the SBOM generation tasks, ensuring that all SBOMs are generated before publishing.

Before publishing:

-   Ensure that the `npmRegistryForPublish` property is defined for Frontend Component publishing in the `gradle.properties`.
-   Ensure that the latest version of Trivy is installed for Frontend Component SBOM generation.

Then run the following command to publish your packages:

```bash
./gradlew publish
```

---


### Documentation

-   Full technical documentation is available at [GetA12.com](https://GetA12.com).
    -   documentation can also be built from the [documentation](./documentation/package.json) module
-   The website also provides access to the **A12 Discourse Community Forum**.

---

## Module Documentation

This repository follows a monorepository structure, with functionality organized into separate modules.
Modules can be grouped into three categories, according to the type of code they consist of, which
influences how to [build](#building-individual-modules) them.

-   FE - frontend only code
-   BE - backend only code
-   FS - fullstack, mix of both backend and frontend

| Module                 | Description                                                                                                   | Module Type |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| buildSrc               | shared definitions and scripts for the build process with [Gradle]                                            | BE          |
| codemod                | recipes to migrate print engine related code                                                                  | FE          |
| documentation          | official getA12 documentation for the Print Project                                                           | FE          |
| engine-api             | defines API of java backend for the Print Engine through interfaces and configuration classes                 | BE          |
| engine-runtime         | core implementation of the Print Engine and implementation of the PDF, PDFBox and Model Document Print Engine | BE          |
| engine-runtime-codegen | generates boilerplate code for the engine-runtime                                                             | BE          |
| engine-runtime-kernel  | parse and interprets Computation Statements in Print Models                                                   | FS          |
| engine-runtime-test    | utils and test models for testing the different kinds of Print Engines                                        | BE          |
| engine-runtime-xml     | uses engine-runtime to implement the XML Print Engine                                                         | BE          |
| model-api              | defines and implements API to generate and process Print Models                                               | FS          |
| model-api-codegen      | generates static code based on the Print Meta Model for model-api                                             | BE          |
| model-api-utils        | contains utility functionality for processing Print Models                                                    | FS          |
| model-document         | defines the Model Document Print Engine Result                                                                | BE          |
| model-editor-component | UI editor for Print Models                                                                                    | FE          |
| model-migration        | contains migration steps for Print Models, Print Setting Models and Typesetting Models                        | FS          |
| print-dev-tools        | shared configurations for frontend dev tools                                                                  | FE          |
| print-fonts            | provides default font resources, shared constants and utilities for the Print Engine                          | FE          |
| print-setting          | defines Print Setting Model and the corresponding UI editor                                                   | FS          |
| print-shell            | CLI tool for the printing process and some utility functionality                                              | BE          |
| print-workspace        | specific workspace functionality for print-shell to handle Print related files                                | BE          |
| test-app               | serves as a running Print Model Editor for development purposes                                               | FE          |
| typesetting            | defines Typesetting Models and the corresponding UI editor                                                    | FS          |


---

**The mgm A12 Team**

[mgm technology partners GmbH](https://www.mgm-tp.com) | [Imprint](https://www.mgm-tp.com/imprint.html)

<!-- References -->

[JDK]: https://www.oracle.com/technetwork/java/javase/overview/index.html
[Gradle]: https://docs.gradle.org/
[Node]: https://nodejs.org/en/docs/
[Playwright]: https://playwright.dev/
[pnpm]: https://pnpm.io/motivation
[Trivy]: https://trivy.dev/
