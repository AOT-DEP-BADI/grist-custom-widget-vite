Devtools Grist
==============

## Commands

### Dev

```
pnpm dev 
```

Launches the development environment using the **[tsdown](https://tsdown.dev/guide/)** binary. Specifically, it runs the `tsdown --watch` command. The `--watch` option instructs `tsdown` to monitor your files. As soon as a file is modified in `src/`, the project is instantly recompiled into a temporary directory.

### Test

```
pnpm test 
```

Launches the test environment configured with **[Vitest](https://vitest.dev/guide/)**. This allows running all `.test.ts` unit and integration tests in parallel, providing a clear visual report in the console.

### Build

```
pnpm build 
```

This command calls the **[tsdown](https://tsdown.dev/guide/)** binary, which is responsible for compiling the source code (TypeScript) into the distribution folder (`dist/`). **tsdown** relies on the Rolldown engine (written in Rust) to transpile TypeScript `.ts` files into ECMAScript Module (ESM) `.mjs` files executable by Node.js at ultra-fast speeds.

> **Did you say .mjs file?**<br/>
> In the Node.js ecosystem, the `.js` extension can be interpreted as CommonJS (the old `require` format) if the project's `package.json` does not specify the `"type": "module"` configuration. The `.mjs` extension forces Node.js to use the ESM format (with `import`/`export`), regardless of the configuration.

Note the presence of the `prepublishOnly` command in the `package.json` file, which automatically runs the build command (`pnpm run build`) before publishing. This is a safety hook ensuring that publishing to a Node.js registry does not rely on an outdated `./dist`. The Node.js `prepublishOnly` hook executes only during the `pnpm publish` command.

Even if the tool is not published to the public npm registry, it is still useful to use it for compiling your project. During a build at the root of the global project, pnpm will know that it must prepare this package first. This ensures you never ship broken or outdated source code.

### TypeScript checking types

```
pnpm typecheck
```

This command is an essential safety step in TypeScript.

The `tsdown` tool quickly transpiles TypeScript source code into a JavaScript module, as the latter does not necessarily check type validity during compilation. By using the official TypeScript compiler, **[tsc](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)**, we ensure the quality of the source code's types. Specifically, we use the `tsc --noEmit` command, which asks the compiler to scan your entire project for typing errors (mistyped variables, incompatible types) without generating any output files.

```typescript
export function fn(): string {
  return 123; 
}

// In this case, pnpm typecheck returns an error:
// ./src/cli.ts:2:3 - error TS2322: Type 'number' is not assignable to type 'string'.
```

### Release

```
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
> To name tags specifically, especially when you have multiple projects in a Node.js workspace, use the `bumpp --tag @aot-dep-badi/devtools-grist-widget@%s` option.

---

## Known issues

### Installing tsdown with pnpm workspace (known issue in Windows)

Sometimes pnpm struggles with recursive resolution when you run the command inside a deep sub-folder. Try running the command from the root of the project using a filter instead.

```
./tool/devtools-grist-widget> pnpm add -D tsdown
ERROR: Cannot destructure property 'manifest' of 'manifestsByPath[rootDir]' as it is undefined.
```

To resolve this known issue, run the command from the root of the project by adding a filter with the `--filter` option.

```
./tool/devtools-grist-widget> cd ..
.> pnpm add -D tsdown --filter @aot-dep-badi/devtools-grist-widget
```

### Tsdown - Failed to import module "unrun". Please ensure it is installed.

```
pnpm add -D unrun --filter @aot-dep-badi/devtools-grist-widget
```

### How to add dependencies for devtools-grist from root monorepo

```
pnpm add -D tsdown --filter @aot-dep-badi/devtools-grist
pnpm add -D unrun --filter @aot-dep-badi/devtools-grist
pnpm add -D execa --filter @aot-dep-badi/devtools-grist
```