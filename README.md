Grist custom widget vite
========================
<small>[**Français**](./README.fr.md) | *English*</small>

> **Vite-based boilerplate for creating Grist custom widgets.**
>
> A lightweight and efficient collection of templates (React, Vanilla with or without TypeScript...) to jumpstart your Grist custom widget development into modern ecosystem [Vite.js](https://vite.dev/)


## Preamble

This boilerplate provides a robust foundation for building Grist custom widgets. By leveraging Vite.js for near-instant Hot Module Replacement (HMR) and optionally TypeScript for end-to-end type safety, it ensures a comfortable developer experience. It also includes a dockerized Grist environment, allowing you to test widgets in a real Grist instance locally with zero manual setup. The architecture is highly flexible: it automatically manages your widget manifest and supports two build strategies (Standard vite for optimized assets spliting or SPA (single page application)) for your deployment needs.

**Main features:**

- **Zero-Setup Environment**: A fully orchestrated, ready-to-use workspace for developers, featuring a local dockerized Grist instance.
- **Multiple Flavors**: Kickstart your project with your preferred tech stack, supporting both Vanilla and React in either *JavaScript or TypeScript.
- **Flexible Bundling**: Choose your deployment strategy with support for *Standard asset splitting* with cache-busting or a SPA build (*Single Page Application*).
- **Unified Devtools CLI**: Effortlessly manage local development, production building, and previewing through a unique CLI application providing simple commands (`dev`, `build`, `preview`).


## Quick Start

### Prerequisites

Before starting, ensure the following requirements:

- **Docker** with **Docker Compose**: >=28.4 
- **Node.js**: ^20.19 or >=22.12
- **Package Manager**: pnpm (*recommended*)


### Scaffolding your Grist custom widget project

Use [tiged](https://github.com/tiged/tiged) to instantly clone one of our official templates into your own project directory.

```bash
# Scaffold your Grist custom widget project 
npx tiged AOT-DEP-BADI/grist-custom-widget-vite/templates/react my-widget

# Navigate to your project folder
cd my-custom-grist-widget

# Install dependencies
pnpm install

# Start the development
pnpm dev 
```

![devtools dev command](docs/assets/images/devtools_dev_command.png)<small>— Launch Grist custom widget development environment</small>

Et voilà, you're ready to dev on your Grist custom widget! Once your project is scaffolded, you can use the following commands 
- to start your local development environment (`pnpm dev`),
- to lauch tests (`pnpm test`), 
- to build the Grist widget for production (`pnpm build`), 
- and to preview the production build (`pnpm preview`).


## TL;DR

### Available Grist widget templates

It provides a set of templates to *jumpstart* your Grist custom widget development, you can choose the one that suits you best.

| Grist widget template                     | Command to scaffold a new project                                                |
|-------------------------------------------|----------------------------------------------------------------------------------|
| **React** *(JavaScript)*                  | `npx tiged AOT-DEP-BADI/grist-custom-widget-vite/templates/react my-widget`      |
| **React** *(TypeScript + React compiler)* | `npx tiged AOT-DEP-BADI/grist-custom-widget-vite/templates/react-ts my-widget`   |
| **Vanilla** *(JavaScript)*                | `npx tiged AOT-DEP-BADI/grist-custom-widget-vite/templates/vanilla my-widget`    |
| **Vanilla** *(TypeScript)*                | `npx tiged AOT-DEP-BADI/grist-custom-widget-vite/templates/vanilla-ts my-widget` |


### Start the local Grist environment development (`pnpm dev`)

1. **Configure your Grist custom widget**<br/> 
   Configure your widget by editing the `manifest.json`. This makes the widget available in the list in custom widgets of your Grist local instance (Docker). Don't forget to change the id of your widget.
    ```json
    [
      {
        "name": "Startiflette",
        "url": "http://localhost:5173/index.html",
        "widgetId": "@acme/my-widget",
        "isDevInProgress": true,
        "published": true,
        "accessLevel": "none",
        "renderAfterReady": true,
        "description": "Lorem ipsupm dolor sit amet.",
        "isGristLabsMaintained": false,
        "authors": [
          {
            "name": "v20100v",
            "url": "https://github.com/v20100v"
          }
        ]
      }
    ]
    ```

2. **Start the local Grist environment**<br/>
   ```bash
   pnpm dev
   ```

   This command launches a Grist Docker container at http://localhost:8484 and a Vite web server with HMR (*Hot Module Replacement*) at http://localhost:5173, which also serves the widget manifest at http://localhost:5173/manifest.json.

   > **Tips**
   >  - For more detailed output during startup, you can use the `--verbose` or `-v` flag in dev command. This is helpful for troubleshooting container orchestration or server initialization.
   >  - You can customize the ports of the Vite web server and the Grist Docker container by setting the `VITE_PORT` and `GRIST_PORT` environment variables, or by using the `--vite-port` and `--grist-port` flags.

3. **Check local Grist manifest availability**.<br/>Ensure your widget is correctly exposed by checking the dynamically generated manifest.json at http://localhost:5173/manifest.json.

4. **Use the widget into the local Grist**. Once the dev environment is running, open the local Grist instance at http://localhost:8484 in order to create a new document and add into a custom view.
    ![Local widget load into Grist instance local (Docker)](docs/assets/images/devtools_dev_load-widget-in-Grist-instance.png)<small>— Local widget load into Grist instance local</small>

    > **Note**: You will notice that your local widget is immediately accessible in Grist. This happens automatically because the Docker container uses the `GRIST_WIDGET_LIST_URL` environment variable to look at your local server. Behind the scenes, two dedicated Vite plugins (`generateGristManifestPlugin` and `updateGristManifestDistPlugin`) ensure that your `manifest.json` is always generated and up-to-date.
   
5. And there’s the final widget! Thanks to HMR (*Hot Module Replacement*) provides by Vite.js, your code changes are reflected instantly without a full page refresh. Unlike standard Live Reload, HMR updates only the modified modules. This preserves your widget’s current state and data, ensuring a seamless and lightning-fast development workflow.

    ![Real-time Widget Rendering in Grist with HMR](docs/assets/images/devtools_dev_widget-react-in-Grist.png)
    <small>— Real-time Widget Rendering in Grist with HMR</small>

Happy coding!


### Build your Grist custom widget for production (`pnpm build`)

It depends of template chosen. The build process compiles your TypeScript source code and assets into a production-ready widget, optimizing for both performance and compatibility. It leverages Vite.js for asset bundling and the React Compiler for optimized rendering. The final artifacts are organized within the dist/ folder, ready for deployment.

   ```bash
   pnpm build
   ```


### Preview the production build (`pnpm preview`)

Preview mode allows you to test the production-ready version of your widget (the compiled files in /dist) within a live Grist instance before deployment.

```
pnpm preview
```

This command orchestrates four key stages:

- **Production build**: Automatically triggers a build using NODE_ENV: production and PREVIEW_MODE: true environment variables to ensure your assets are compiled specifically for the preview environment.

- **Vite preview server**: Starts a local web server on port 4173 (in strict mode) to serve the static files directly from the dist/v.{x.y.z}/ directory.

- **Dockerized Grist**: Launches a Grist container pre-configured to automatically recognize the production manifest stores in dist/v.{x.y.z}/manifest.json

- **Dynamic Linking**: Injects the production manifest URL (http://host.docker.internal:4173/manifest.json) into the Grist environment via the GRIST_WIDGET_LIST_URL variable, making your widget instantly available in the Grist custom widget catalog.



## About

### Want to contribute?

Ideas, bug reports, reports a typo in documentation, comments, pull-request & Github stars are always welcome !


### License

Release under [MIT License](./LICENSE),<br/>
Copyright (c) 2026 Académie Orléans-Tours, Bureau analyse et développement informatique
