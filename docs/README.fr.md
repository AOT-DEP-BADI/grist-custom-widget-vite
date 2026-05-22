Grist custom widget vite
========================

## Développement

### Prérequis

- Node.js (version 20.20+)
- pnpm (version 10.28+)
- Docker (version 28.4+) et Docker Compose

Assurez-vous que [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/), [Docker](https://docs.docker.com/desktop/) et [Docker compose](https://docs.docker.com/compose/install/) sont installés globalement sur votre machine.


### Installation

```bash
# Cloner localement le monorepo
git clone https://github.com/badi-grist/grist-widget-vite.git

# Installe les dépendances de tous les packages du monorepo (devtools + templates)
pnpm install
```

### Multiples environnements de développement 

#### Développement de *devtools-grist*

Pour lancer l'environnement de développement local du package **devtools-grist**, on peut le faire directement depuis la racine du projet avec la commande alias suivante.

```
pnpm dev:devtools
```

> **Remarque** : Cette commande est un raccourci pour `pnpm --filter devtools-grist dev`, et l'environnement tsdown fournit par la solution rolldown (exécute précisément tsdown --watch). Grâce à l'option --watch, tsdown surveille les fichiers en temps réel, et dès qu'une modification est détectée dans le dossier ./devtools-grist/src/, le projet est instantanément recompilé dans un répertoire temporaire.

#### Développement de *templates*

Pour lancer l'environnement de développement local pour un des templates, on peut le faire directement depuis la racine du projet avec la commande alias suivante.

```
pnpm dev:template:react
pnpm dev:template:react
pnpm dev:template:react-ts
pnpm dev:template:vanilla
pnpm dev:template:vanilla-ts
```

Il est aussi possible de lancer en parallèle, l'ensemble des environements de développement de chaque template avec la commande suivante.

```
pnpm dev:all-templates
```






## Under the hood

### Architecture monorepo

Ce projet utilise une architecture *monorepo*, qui consiste à regrouper, au sein d'un seul et même dépôt Git, plusieurs projets co-dépendants, et qui auraient traditionnellement été séparés. La gestion de multiples dépôts (polyrepo) peut rapidement devenir un frein à l'agilité des projets : duplication de code, désynchronisation des versions, complexité des tests d'intégration (e2e), lourdeur de maintenance des configurations. L'architecture monorepo répond à ces défis en regroupant plusieurs projets, bibliothèques et outils au sein d'un unique dépôt Git.

La solution proposée avec **pnpm workspaces** permet de créer un écosystème cohérent, où le partage de code est immédiat et la gestion des dépendances est plus rigoureuse et performante. 

 - **Performances (*Content-Addressable Store*)** : pnpm stocke tous les paquets dans un dossier global unique sur votre machine (`/.pnpm-store`). Les node_modules de vos projets ne contiennent que des liens matériels (hard links) vers ce store.
 - **Sécurité (*No Phantom Dependencies*)** : Contrairement à npm ou Yarn qui mettent à plat (hoisting) l'arbre des dépendances, pnpm crée une structure de node_modules stricte via des liens symboliques. Un projet ne peut charger un package qu'il n'a pas explicitement déclaré dans son package.json, gage de sécurité.
 - **Gestion native des workspaces** : Pas besoin d'installer des outils tiers complexes pour orchestrer les dépendances internes. pnpm gère nativement les liaisons entre vos packages locaux.

### Définition du workspace `grist-widget-vite`

Le projet **Grist-custom-widget-vite**, en tant que monorepo, est structuré autour de deux répertoires principaux : `./templates` et `./tools`. Ces deux répertoires contiennent des packages distincts, reliés entre eux au sein d'un workspace pnpm.

```
grist-widget-vite/         # Monorepo
├── templates/             # Chaque template dépend de @badi/tools/devtools-grist
│   ├── react  /           # Template widget React/Vite
│   ├── react-ts  /        # Template widget React+TypeScript/Vite
│   ├── vanilla  /         # Template widget Vanilla/Vite 
│   └── vanilla-ts/        # Template widget Vanilla+TypeScript/Vite 
├── tools/                 # Outils partagés (consomés par les templates)
│   └── devtools-grist/    # CLI (Server Vite + Grist docker + publication manifest widget)
├── pnpm-workspace.yaml    # Configuration du workspace pnpm
├── package.json           # Scripts globaux du monorepo
└── pnpm-lock.yaml         # Lockfile unique pour tout le monorepo
```

La définition du workspace, ce fait dans le fichier `pnpm-workspace.yaml` à la racine du projet. Il définit les dossiers qui contiennent les packages du workspaces.

```yaml
packages:
  - 'templates/*' # Widgets prêts à l'emploi (boilerplates)
  - 'tools/*'     # Outils de développement & plugins de build
```

> Le dossier `./templates` contient des structures d'applications (*boilerplates*) standardisées et optimisées pour concevoir des widgets Grist personnalisés basés sur l'écosystème Vite.js. Ces templates servent de base pré-configurée pour démarrer rapidement. Chacun d'eux intègre nativement le plugin API JavaScript de Grist ainsi que l'outil CLI `devtools-grist`.
>
> Le dossier `./tools` contient les outils d'aide au développement de widget, dont l'application CLI `devtools-grist`. Ce dernier fournit un environnement de développement standard de custom widget Grist, en fournissant un server web local (via Vite.js), un conteneur Docker pour exécuter localement une instance de Grist, et des plugins vite sur mesure en charge d'automatiser la génération et la mise à jour du référentiel des widgets Grist (manifest.json).

### Déclaration des packages internes au workspace

Pour qu'un package de template (comme `./templates/react`) puisse consommer le package interne `devtools-grist`, on utilise le protocole `workspace:*` dans le champ des dépendances du fichier `package.json` du template.

```json
{
  "name": "grist-widget-vite-template-react",
  "devDependencies": {
    "@aot-dep-badi/devtools-grist": "workspace:*",
    "(...)
  }
}
```

En phase de développement, ce protocole permet à pnpm de lier directement les packages locaux (via des liens symboliques). Ensuite, lors du build de production ou de la publication, pnpm remplace automatiquement le mot-clé `workspace:*` par la version réelle et exacte du package ciblé.


### Commandes essentielles du workspace

L'administration d'un *workspace pnpm* repose principalement sur l'usage du flag `--filter` (ou `-F`), qui permet de cibler précisément un ou plusieurs packages, ainsi que sur le flag `-r` (`--recursive`) qui permet d'éxcuter une commande sur tous les packages du workspace sélectionés.


| Commande                                                 | Description                                                                                                                                                                                                                                                                                                                                                                    |
|----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `> pnpm install`                                         | **Installer l'intégralité des dépendances du workspace**<br/><br/>Analyse tous les fichiers `package.json` du monorepo et installe ou met à jour l'ensemble des dépendances. Grâce au *Content-Addressable Store* global de pnpm, les paquets communs ne sont téléchargés qu'une seule fois sur la machine.                                                                    |
|
| `> pnpm --filter @aot-dep-badi/devtools-grist add execa` | **Pour ajouter une dépendance externe dans un package précis**<br/><br/>Installe un paquet tiers (ici `execa`) uniquement dans le périmètre du package spécifié (`@aot-dep-badi/devtools-grist`). Cela garantit l'isolation stricte des dépendances entre les différents packages du monorepo.                                                                                 |
|
| `> pnpm --filter @aot-dep-badi/devtools-grist update`    | **Mettre à jour les dépendances d'un package précis**<br/><br/>Met à jour les dépendances obsolètes spécifiquement pour le package ciblé, ce qui permet de faire évoluer vos modules de manière incrémentale sans risquer de casser le reste du monorepo.                                                                                                                      |
| `> pnpm --filter grist-widget-vite-template-react dev`   | **Lancer le script d'un projet spécifique**<br/><br/>Exécute une commande de script défini dans le package.json du package (ici `dev` pour démarrer un serveur de développement) uniquement pour le package désigné, sans avoir à se déplacer manuellement dans son sous-dossier. Idéalement, on lance toutes les commandes à la racine du monorepo, sans avoir à se déplacer. |
| `> pnpm -r run build`                                    | **Exécuter un script de manière récursive**<br/><br/>Parcourt automatiquement tous les packages du monorepo pour y lancer le script spécifié (ici `build`). Seuls les modules possédant ce script dans leur `package.json` l'exécuteront.                                                                                                                                      |

### Orchestration dans un workspace

1. **Exécution simultanée (*parallel*)**

   Ajoute l'option `--parallel` pour exécuter une commande récursive de manière totalement asynchrone, en ignorant l'ordre des dépendances. L'exécution se fait en parallèle sur tous les modules. Idéal pour lancer simultanément tous les environnements de développement d'un seul coup.

   ```
   pnpm -r --parallel run dev
   ```

2. **Filtrage par dossier (*globbing*)**

   La syntaxe `--filter "{dossier/**}"` permet de restreindre l'exécution récursive à un sous-ensemble structurel du workspace. Par exemple, pour lancer le script de développement uniquement sur les packages situés dans le sous-répertoire des templates, on utilise la commande suivante.
   
   ```
   pnpm -r --filter "{templates/**}" run dev
   ```

3. **Gestion de l'arbre des dépendances locales (*ellipsis*)**

   L'utilisation d'une ellipsis constituée de trois points (...) sur un filtre est une fonctionnalité clé pour piloter les projets interdépendants au sein du workspace.
    - **Les points APRÈS le nom (pkg...) servent à cibler le projet et ses dépendances.** Par exemple exécuter la commande `pnpm --filter templates/react... build` va forcer pnpm à résoudre l'arbre en amont. Il va d'abord compiler toutes les dépendances locales requises *avant* de lancer le build du template React.
    - **Les points AVANT le nom (...pkg) servent à cibler le projet et ses dépendants.** Si vous modifiez un outil transverse partagé, par exemple situé dans packages/devtools, et que vous voulez mesurer l'impact de ce changement, exécuter `pnpm --filter ...packages/devtools test` va cibler le package devtools lui-même ainsi que *tous* les projets du monorepo qui l'utilisent.







### 🚀 Démarrage & Environnement de Développement



#### Lancer l'environnement de développement

Selon vos objectifs, vous pouvez démarrer différentes parties du workspace :

* **Lancer tous les widgets templates en parallèle :**
```bash
pnpm dev

```


*Cette commande lance le serveur Vite avec support du rechargement à chaud (HMR) pour l'ensemble des templates simultanément.*
* **Lancer le template React spécifiquement :**
```bash
pnpm run:dev:template:react

```


* **Lancer l'environnement de dev pour l'outillage (`tools/devtools-grist`) :**
  Si vous devez modifier ou faire évoluer les outils de build situés dans le dossier `tools`, lancez le compilateur en mode observation (*watch*) via le raccourci de filtrage :
```bash
pnpm dev:devtools

```


*Sous le capot, cette commande exécute `pnpm --filter devtools-grist dev`, activant le compilateur ultra-rapide `tsdown` (propulsé par Rust) sur le code source de `tools/src/`.*

---

### ⚙️ Matrice des Commandes du Workspace

Ces commandes doivent être exécutées à la **racine** du projet pour piloter le workspace en toute sécurité :

| Action | Commande de script | Description |
| --- | --- | --- |
| **Dev (Global)** | `pnpm dev` | Lance la compilation de développement pour tous les packages en parallèle. |
| **Dev (Devtools)** | `pnpm dev:devtools` | Démarre le compilateur `tsdown --watch` dédié au package devtools. |
| **Run Grist Devtools** | `pnpm run:devtools` | Initialise les points d'entrée de l'environnement de création de widget. |
| **Test (Global)** | `pnpm test` | Exécute les tests unitaires via Vitest en parallèle sur tous les packages. |
| **Build (Global)** | `pnpm build` | Compile chaque package pour la distribution de production (`dist/`). |

---

