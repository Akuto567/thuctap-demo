# Minigame Builder

A desktop app (Electron) for non-technical English teachers to create custom classroom minigames **without writing any code**. Teachers fill in words, questions, images and other content through a visual editor, then export a self-contained game they can open directly in any browser.

---

## Repository Layout

```
minigame-builder/
├── build-templates.sh              # Local build helper (see below)
├── .github/workflows/build-all.yml # CI: builds templates then packages the app
│
├── template-projects/              # One sub-folder per game type
│   ├── group-sort/                 # Vite + React standalone game
│   └── plane-quiz/
│
└── builder-projects/
    └── electron-app-mui/           # The Electron editor app
        ├── src/
        │   ├── main/
        │   │   ├── index.ts        # Electron main process + all IPC handlers
        │   │   └── gameRegistry.ts ← ADD TRANSFORMS HERE for new games
        │   └── renderer/src/
        │       ├── games/
        │       │   ├── registry.ts ← ADD NEW GAMES HERE (editors + initial data)
        │       │   ├── group-sort/
        │       │   │   └── GroupSortEditor.tsx
        │       │   ├── plane-quiz/
        │       │   │   └── QuizEditor.tsx
        │       │   └── balloon-letter-picker/
        │       │       └── BalloonLetterPickerEditor.tsx
        │       ├── components/     # Shared UI primitives (ImagePicker, EditorShared…)
        │       ├── pages/          # HomePage, ProjectPage
        │       ├── context/
        │       ├── hooks/
        │       └── types/
        └── templates/              # Built game assets injected at build time
            ├── group-sort/
            │   ├── game/           # Built output (index.html + images)
            │   └── meta.json
            └── plane-quiz/
                ├── game/
                └── meta.json
```

---

## How it works

1. **Template projects** are standalone Vite + React apps. Each builds to a single `index.html` (via `vite-plugin-singlefile`) plus any image assets.
2. **The builder** reads those built files from its `templates/` directory. When a teacher exports a project the builder injects the teacher's data directly into the HTML (`window.APP_DATA`) and copies any image assets alongside it.
3. The final export is a plain folder (or ZIP) that works offline in any browser — no server needed.

---

## Game Template Requirements

A game template project can use **any tooling** as long as the build output meets these constraints.

### Build output

| File | Requirement |
|---|---|
| `index.html` | **Single-file HTML** — all JS and CSS must be inlined. Use `vite-plugin-singlefile` (or equivalent) to achieve this. |
| `images/` (optional) | Image assets that cannot be inlined. Keep the file count minimal. The builder will copy these alongside the exported `index.html`. |

> No other asset types should be emitted. Fonts, icons, and small SVGs should be inlined into the HTML.

### Runtime data contract

The builder injects teacher-created content **before the first `<script>` tag** as:

```html
<script>
  window.APP_DATA = { /* teacher's data */ };
  window.MY_APP_DATA = window.APP_DATA;   // legacy alias
  window.win = { DATA: window.APP_DATA }; // legacy alias
</script>
```

Your game reads `window.APP_DATA` at startup. The shape of that object is whatever you define — just make sure the editor produces matching data (see the main-process `gameRegistry.ts` if a transform is needed).

### `meta.json`

Each template folder must contain a `meta.json` next to the `game/` sub-folder:

```json
{
  "name": "Human-readable Game Name",
  "description": "One sentence shown on the home screen.",
  "gameType": "your-game-id",
  "version": "1.0.0"
}
```

Optionally place a `thumbnail.png` (or `.jpg`/`.webp`) next to `meta.json` for a preview image on the home screen.

---

## Prerequisites

- **Node.js** 20+
- **Yarn** 4 (`corepack enable && corepack prepare yarn@4.12.0 --activate`)

---

## Local development

```bash
# 1. Build all game templates and copy them into the builder
./build-templates.sh

# 2. Start the builder in dev mode
cd builder-projects/electron-app-mui
yarn install
yarn dev
```

To build only a single game template:

```bash
./build-templates.sh plane-quiz
```

---

## Adding a new game — complete guide

### Step 1 — Create the template project

Create a new folder under `template-projects/`:

```bash
cp -r template-projects/plane-quiz template-projects/my-new-game
# or scaffold from scratch with: yarn create vite
```

**Requirements** (see [Game Template Requirements](#game-template-requirements) above):
- Use `vite-plugin-singlefile` so the build produces a single `index.html`.
- Read teacher data from `window.APP_DATA` at runtime.
- Keep any image assets in an `images/` folder; don't emit other loose assets.

Add a `meta.json` at `template-projects/my-new-game/` level:

```json
{
  "name": "My New Game",
  "description": "Short description for the home screen.",
  "gameType": "my-new-game",
  "version": "1.0.0"
}
```

Optionally add `thumbnail.png` for the home screen card.

### Step 2 — Register the template in the build script

Open `build-templates.sh` and add one line to the `GAMES` array:

```bash
GAMES=(
  "template-projects/group-sort|group-sort"
  "template-projects/plane-quiz|plane-quiz"
  "template-projects/my-new-game|my-new-game"   # ← add this
)
```

Run `./build-templates.sh my-new-game` to verify the build succeeds and the output lands in `builder-projects/electron-app-mui/templates/my-new-game/game/`.

### Step 3 — Register the template in the CI workflow

Open `.github/workflows/build-all.yml` and add your project to the `build-templates` job matrix:

```yaml
matrix:
  include:
    - project_path: "template-projects/group-sort"
      game_id: "group-sort"
    - project_path: "template-projects/plane-quiz"
      game_id: "plane-quiz"
    - project_path: "template-projects/my-new-game"   # ← add this
      game_id: "my-new-game"
```

### Step 4 — Add the TypeScript data types

Open `builder-projects/electron-app-mui/src/renderer/src/types/index.ts`.

1. Define the shape of your project data:

```ts
// ── My New Game ───────────────────────────────────────────────────────────────
export interface MyNewGameItem {
  id: string
  text: string
}
export interface MyNewGameAppData {
  items: MyNewGameItem[]
  _itemCounter: number
}
```

2. Add it to the `AnyAppData` union:

```ts
export type AnyAppData = GroupSortAppData | QuizAppData | BalloonLetterPickerAppData | MyNewGameAppData
```

### Step 5 — Write the editor component

Create `builder-projects/electron-app-mui/src/renderer/src/games/my-new-game/MyNewGameEditor.tsx`.

The component must accept these props:

```tsx
interface Props {
  appData: MyNewGameAppData
  projectDir: string
  onChange: (data: MyNewGameAppData) => void
}
```

Call `onChange` with a new (immutable) copy of `appData` every time the teacher makes a change — the framework handles undo/redo and auto-save from there.

Reuse shared primitives from `../../components/EditorShared` (tabs, counters, etc.) and `../../components/ImagePicker` for image selection.

### Step 6 — Register the editor (renderer registry)

Open `builder-projects/electron-app-mui/src/renderer/src/games/registry.ts` and add:

```ts
import MyNewGameEditor from './my-new-game/MyNewGameEditor'

export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  // ...existing entries...

  'my-new-game': {
    Editor: MyNewGameEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      items: [],
      _itemCounter: 0
    })
  }
}
```

`createInitialData` must return a valid empty `MyNewGameAppData` that your editor can render without crashing.

### Step 7 — Register a data transform if needed (optional)

If the shape of `window.APP_DATA` that your game template **reads at runtime** differs from the shape stored in the project file (like `balloon-letter-picker` which flattens an object array), add a transform in `builder-projects/electron-app-mui/src/main/gameRegistry.ts`:

```ts
export const GAME_DATA_TRANSFORMS: Record<string, DataTransform> = {
  // ...existing entries...

  'my-new-game': (appData) => {
    const data = appData as MyNewGameAppData
    // return whatever shape your game template expects
    return data.items.map(({ text }) => ({ text }))
  }
}
```

If the runtime shape is identical to the stored shape, skip this step entirely.

### Step 8 — Test locally

```bash
# Build the new template and copy it to the builder
./build-templates.sh my-new-game

# Run the builder in dev mode
cd builder-projects/electron-app-mui
yarn dev
```

Check that:
- [ ] Your game appears as a card on the home screen with the correct name and description.
- [ ] Creating a new project opens the editor without errors.
- [ ] Editing content, saving, closing, and re-opening round-trips correctly.
- [ ] Preview opens the game with the teacher's data loaded.
- [ ] Export (folder and ZIP) produces a working standalone game.

---

## CI / Release

The GitHub Actions workflow (`.github/workflows/build-all.yml`) runs automatically on `workflow_dispatch`. It:

1. Builds every template project in parallel.
2. Downloads all built templates into a staging area.
3. Copies them into the builder's `templates/` directory.
4. Packages the Electron app for Windows and Linux.
5. Uploads installers as GitHub artifacts.
