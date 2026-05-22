E2E Integration Testing: isolated template sandbox
==================================================

## Preamble

Before publishing or distributing the `@6i/devtools-grist` package, we need to ensure it behaves flawlessly in a real-world, standalone scenario.

The directory `./tests/mock-widget-react-isolated` is a dedicated isolated sandbox designed to mimic the exact environment of an end-user. By cutting all ties with the local monorepo (pnpm workspace), this mock project allows us to verify that the CLI tool can correctly locate its embedded docker-compose.yml asset and orchestrate the Grist container when installed as a standard, third-party node_module.


## Getting Started

### Very-quickstart

```
pnpm test:e2e
pnpm test:e2e:run
```

### Quickstart

```
# From the root of the monorepo, create the archive devtools in ./tests/pack
$grist-widget-vite> pnpm pack:devtools

# Navigate to the isolated test folder and install dependencies from the local archive
$cd ./tests/e2e/mock-widget-react-isolated
$grist-widget-vite/tests/e2e/mock-widget-react-isolated> pnpm install

# Boot up the local development environment from within the isolated directory
$grist-widget-vite/tests/e2e/mock-widget-react-isolated> pnpm dev
```

### TL;DR

1. From the **workspace root**, create the archive devtools by running the centralized archive command:
   ```
   pnpm pack:devtools
   ```
   > It builds the TypeScript source code inside `tools/devtools-grist` and generates a compressed tarball archive (e.g., `6i-devtools-grist-0.1.0.tgz`). And by using the `--pack-destination` flag, it redirects the output directly into `./tests/pack/`.

2. Navigate to the isolated test folder and install dependencies from the local archive. 
   ```
   cd ./tests/mock-widget-react-isolated
   pnpm install
   ```
   > This installation process is a bit different from the one in the workspace. pnpm resolves the dependency pointing to your local `.tgz` archive and extracts a physical, standalone copy into the local `node_modules/@6i/devtools-grist/`.
   >
   > **Notes**: The presence of a local, empty `pnpm-workspace.yaml` file inside this directory acts as a circuit-breaker of workspaces pnpm. It stops pnpm from bubbling up to the root workspace. This forces pnpm to treat the mock folder as a 100% independent project with no symlinks or shared dependencies, exactly like the end user.


3. Boot up the local development environment from within the isolated directory by running the devtools-grist dev command.
   ```
   pnpm dev
   ```
   > - Ensures Vite starts cleanly, automatically picking an available port (e.g., 5173 or 5174 if the port is busy).
   > - ESM resolution for `docker-compose.yml` asset. Verifies that `import.meta.resolve` (mapped to `fileURLToPath`) successfully resolves the absolute native OS path to the `docker-compose.yml` hidden inside the local node_modules.
   > - Confirms that `docker compose` successfully spins up Grist, dynamically binding the `GRIST_WIDGET_LIST_URL` environment variable to the exact port Vite is currently listening on, , all while isolating container data via a unique project name.

