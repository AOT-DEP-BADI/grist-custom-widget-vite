Devtools Grist
==============

## Environment dev local

### Commands

| Command | Execution context | Description |
| --- | --- | --- |
| `pnpm start-dev` | **Monorepo root** | Automates workspace setup by concurrently launching continuous build (`dev:devtools`) and test (`test:devtools`) processes across split terminal tabs. |
| `pnpm dev:devtools` | **Monorepo root** | Launches the development environment with `tsdown --watch` to instantly recompile the project whenever a file in `./src` changes. |
| `pnpm test:devtools` | **Monorepo root** | Runs all unit and integration tests in parallel using **Vitest**, providing a clear visual report in the console. |
| `pnpm build:devtools` | **Monorepo root** | Compiles TypeScript source code into ESM modules (`.mjs`) inside the `dist/` folder using the ultra-fast, Rust-powered **Rolldown** engine (via `tsdown`). |
| `pnpm package:devtools` | **Monorepo root** | Triggers the build pipeline and bundles the package into a deployable tarball (`.tgz`) located in the centralized `./pack` folder. |
| `pnpm add -D <pkg> --filter @aot-dep-badi/devtools-grist` | **Monorepo root** | *Windows Workaround*: Installs a dev dependency to the specific monorepo package from the root to bypass local pnpm resolution issues. |
| `pnpm typecheck` | **Package folder** (`./tools/devtools-grist`) | Performs a full static analysis of the codebase using `tsc --noEmit` to catch typing errors without generating any output files. |
| `pnpm release` | **Package folder** (`./tools/devtools-grist`) | Starts the interactive **bumpp** CLI to automate semantic versioning, update `package.json`, commit changes, and generate Git tags. |


### Multi-terminal local dev environment launch (`start-dev`)

```shell
# Run from the root of the monorepo
pnpm start-dev
```

To streamline the Developer Experience (DX), this script automates your workspace setup by concurrently launching continuous build and test processes across separate terminal tabs.

It automatically detects your operating system to adapt its behavior. On Windows, for example, it opens a **Windows Terminal (`wt.exe`)** instance split into three distinct tabs:

 - **Build Process:** Launches `pnpm dev:devtools` in watch mode.
 - **Testing:** Runs unit and integration tests in parallel via Vitest (`pnpm test:devtools`).
 - **Helper Guide:** Displays a cheat sheet of recommended commands for different widget flavors (React, Vanilla, TypeScript) to easily test the binary against each template.



### Dev

```shell
# Run from the root of the monorepo (alias for `pnpm dev` in the ./tools/devtools-grist folder)
pnpm dev:devtools
```

Launches the development environment using the **[tsdown](https://tsdown.dev/guide/)** binary. Specifically, it runs the `tsdown --watch` command. The `--watch` option instructs `tsdown` to monitor your files. As soon as a file is modified in `src/`, the project is instantly recompiled into a temporary directory.

### Test

```shell
# Run from the root of the monorepo (alias for `pnpm test` in the ./tools/devtools-grist folder)
pnpm test:devtools 
```

Launches the test environment configured with **[Vitest](https://vitest.dev/guide/)**. This allows running all `.test.ts` unit and integration tests in parallel, providing a clear visual report in the console.

### Build

```shell
# Run from the root of the monorepo (alias for `pnpm build` in the ./tools/devtools-grist folder)
pnpm build:devtools 
```

This command calls the **[tsdown](https://tsdown.dev/guide/)** binary, which is responsible for compiling the source code (TypeScript) into the distribution folder (`dist/`). **tsdown** relies on the Rolldown engine (written in Rust) to transpile TypeScript `.ts` files into ECMAScript Module (ESM) `.mjs` files executable by Node.js at ultra-fast speeds.

> **Did you say .mjs file?**<br/>
> In the Node.js ecosystem, the `.js` extension can be interpreted as CommonJS (the old `require` format) if the project's `package.json` does not specify the `"type": "module"` configuration. The `.mjs` extension forces Node.js to use the ESM format (with `import`/`export`), regardless of the configuration.

**Lifecycle hooks build**

This build workflow includes two key lifecycle scripts to ensure code integrity with the presence of Note of the `prebuild` and `prepublishOnly` properties hook in the `package.json` file.

 - **prebuild**: Automatically runs `pnpm run typecheck` before the build begins. This acts as a quality gate, ensuring that the compilation only proceeds if there are no TypeScript errors.

 - **prepublishOnly**: Automatically triggers `pnpm run build` before the package is published. This is a safety hook ensuring that publishing to a Node.js registry does not rely on an outdated `./dist`. The Node.js `prepublishOnly` hook executes only during the `pnpm publish` command. Even if the tool is not published to the public npm registry, it is still useful to use it for compiling your project. During a build at the root of the global project, pnpm will know that it must prepare this package first. This ensures you never ship broken or outdated source code.

### TypeScript checking types

```shell
# Run from the ./tools/devtools-grist folder
pnpm typecheck
```

This command provides an essential safety net for maintaining code integrity in TypeScript.

While `tsdown` tools excels at transpiling TypeScript source code into JavaScript at blazing speeds, it achieves this by simply stripping away type annotations without actually validating them. To ensure strict type safety, we complement this speed by running the official TypeScript compiler, **[tsc](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)**, purely for validation.

Specifically, the script runs `tsc --noEmit`. This instructs the compiler to perform a full static analysis of the codebase—catching issues like type mismatches, missing properties, or broken interfaces—without generating any boilerplate JavaScript output files.

**Example**

If you introduce a type mismatch in your code:

```typescript
export function fn(): string {
  return 123; 
}
```

Running pnpm typecheck will intercept this immediately and output the compiler error:

```
./src/cli.ts:2:3 - error TS2322: Type 'number' is not assignable to type 'string'.
```

### Packaging

```shell
# Run from the root of the monorepo
pnpm package:devtools
```

This command automates the entire packaging workflow, bundling the tool into a deployable tarball (`.tgz`) using a two-step pipeline:

- **`pnpm build:devtools`**: First, triggers the compilation pipeline (running type checks and bundling the source code via `tsdown` into the `dist/` folder).
- **`pnpm --filter devtools-grist exec pnpm pack`**: Safely scopes the execution to the `devtools-grist` package inside the monorepo. It runs the standard `pnpm pack` command, which gathers all production files, respects your `.npmignore` or `package.json` `files` field, and outputs a clean, ready-to-publish npm tarball.

> **Note**: The `--pack-destination ../../pack` flag ensures that the generated tarball is extracted out of the local package directory and saved into a centralized `pack/` folder at the root of the monorepo. This keeps the workspace clean and makes the package easily accessible for local E2E testing, CI/CD archiving, or manual deployment.


### Release

```shell
# Run from the ./tools/devtools-grist folder
pnpm release
```

The release command uses the **[bumpp](https://github.com/antfu-collective/bumpp)** solution. It allows transitioning from code "in development" to an "official version" ready to be published in a clean and automated way. It is an interactive command-line interface (CLI) tool that handles repetitive and risky tasks related to releasing a new version.

* Increments the version in compliance with semantic versioning. It prompts for a patch (1.0.1), minor (1.1.0), or major (2.0.0) version bump.
* Automatically updates the new version number in `package.json`.
* Automatically creates a git commit (e.g., `v1.0.1`).
* Automatically creates a git tag to mark this precise version in the history.
* It can even automatically push to the remote git repository (GitHub/GitLab).

> **Note**:
> To prevent `bumpp` from pushing tags to your remote repository, use the `bumpp --no-push` option.
> To name tags specifically, especially when you have multiple projects in a Node.js workspace, use the `bumpp --tag @aot-dep-badi/devtools-grist@%s` option.

---

## Known issues

### Installing tsdown with pnpm workspace (known issue in Windows)

Sometimes pnpm struggles with recursive resolution when you run the command inside a deep sub-folder. Try running the command from the root of the project using a filter instead.

```
./tool/devtools-grist> pnpm add -D tsdown
ERROR: Cannot destructure property 'manifest' of 'manifestsByPath[rootDir]' as it is undefined.
```

To resolve this known issue, run the command from the root of the project by adding a filter with the `--filter` option.

```
./tool/devtools-grist> cd ..
.> pnpm add -D tsdown --filter @aot-dep-badi/devtools-grist
```


### Tsdown error: Failed to import module "unrun"

If you encounter an error stating `Failed to import module "unrun". Please ensure it is installed` when launching `tsdown`, it means a peer dependency is missing in the monorepo workspace.

To resolve this, install `unrun` as a dev dependency for the package by running this command from the monorepo root:

```
pnpm add -D unrun --filter @aot-dep-badi/devtools-grist
```


### How to add dependencies for devtools-grist from root monorepo

Few examples:

```shell
# Run from the root of the monorepo
pnpm add -D tsdown --filter @aot-dep-badi/devtools-grist
pnpm add -D unrun --filter @aot-dep-badi/devtools-grist
pnpm add -D execa --filter @aot-dep-badi/devtools-grist
```