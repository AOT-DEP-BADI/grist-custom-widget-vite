# Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased]

- *(No entries)*


---


## [0.1.0-alpha] - 2026-05-26

### Added
- **CLI DevTools Grist custom widget (`@aot-dep-badi/devtools-grist`)** :
  - Add `devtools-grist` CLI package built with `tsdown` and the Rust-based `Rolldown` engine, targeting fast ESM (`.mjs`) outputs.
  - Implement `dev` command (orchestrating local Vite HMR and containerized Docker Grist).
  - Implement `build` command with an automated `prepublishOnly` safety hook for workspace building.
  - Implement `config` command featuring interactive prompts and CLI flags (`--vite-port`, `--grist-port`).
  - Add standardized error handling via a new `DevtoolsError` class.
  - Add custom help formatting, multi-verbosity console logging (`--verbose`), and strict type-checking (`tsc --noEmit`).
- **Grist custom widget templates** :
  - Add sandbox-isolated React template with assets, styles, and a complete E2E test setup.
  - Add official Grist custom widget templates available via `tiged`:
    - **React** (JavaScript & TypeScript with React compiler support).
    - **Vanilla** (JavaScript & TypeScript).
  - Add dedicated Vite plugins (`generateGristManifestPlugin` and `updateGristManifestDistPlugin`) to dynamically generate and update the widget's `manifest.json`.
- **Utilities, Testing & Automation** :
  - Add console helper utilities for ANSI text styling, colored logging, and server diagnostics.
  - Add parallelized unit and integration testing suite configured with `Vitest`.
  - Add automated versioning, git tagging, and semantic release workflows using `bumpp`.
  - Add i18n support with English and French translations for the CLI logs.
- **Initial Setup** :
  - Initialize project and baseline monorepo architecture.
  - Update packaging script for `devtools-grist` CLI.
  - Configure `pnpm` workspaces for monorepo dependency resolution.
  - Update testing dependencies and script tools for sandbox-isolated React widget E2E tests.


### Docs
- Add comprehensive main README and its localized French translation.
- Add package-specific documentation for `devtools-grist`.
- Add MIT license file.

### Chore
- Configure global and package-level `.gitignore` rules (excluding monorepo workspace artifacts, `e2e` test data, build outputs, and `pack` folders).
- Configure pnpm workspace for monorepo dependency resolution.