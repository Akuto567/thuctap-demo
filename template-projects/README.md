# Template Projects

This directory contains **game template projects** — standalone web applications that define the games teachers can create with the Minigame Builder.

---

## ⚡ Quick Start (After Cloning)

**First time setup:**

```bash
# 1. Go to template-projects directory
cd template-projects

# 2. Install dependencies
yarn install

# 3. Build shared libraries (REQUIRED before developing)
yarn build:shared
```

**Then work on your game:**

```bash
cd group-sort
yarn dev
```

> ⚠️ **Important:** You must build shared libraries **before** you can use them in your game project.

---

## Project Structure

```
template-projects/
├── shared/                     # Shared library components
│   └── tutorial-viewer/        # Tutorial image viewer (scaffold for future libraries)
│       ├── src/
│       ├── package.json
│       ├── vite.config.ts      # Uses vite-plugin-css-injected-by-js
│       └── dist/               # Built output (after running build)
│
├── group-sort/                 # Game templates (work directly in these folders)
├── balloon-letter-picker/
├── labelled-diagram/
├── pair-matching/
├── plane-quiz/
├── whack-a-mole/
└── word-search/
```

---

## For Game Template Authors

### Daily Workflow

After the initial setup, you can work **directly in your game folder**:

```bash
cd group-sort
yarn dev      # Start development server
yarn build    # Build for production
```

You **don't need to** go back to the root every time.

### Using Shared Components

Shared components like `@minigame/tutorial-viewer` are available as workspace packages:

**1. Add to your `package.json`:**

```json
{
  "dependencies": {
    "@minigame/tutorial-viewer": "workspace:*"
  }
}
```

**2. Install dependencies** (from your game folder or root):

```bash
cd template-projects
yarn install
```

**3. Use in your code:**

```tsx
import { TutorialViewer } from "@minigame/tutorial-viewer";

function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowTutorial(true)}>
        How to Play
      </button>
      <TutorialViewer
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  );
}
```

> 💡 **Note:** No CSS import needed! The CSS is bundled into the JavaScript output.

### Important: yarn.lock Files

**Do NOT commit `yarn.lock` files in individual game folders** unless that folder is truly the project root.

**Why?** If a `yarn.lock` exists in a game folder (e.g., `group-sort/yarn.lock`), Yarn will treat that folder as the project root instead of recognizing the workspace. This causes:
- `workspace:*` protocol to fail with "workspace not found" errors
- Dependencies not being properly linked

**Solution:** If you encounter this:
```bash
# Remove the conflicting yarn.lock
rm group-sort/yarn.lock

# Reinstall from workspace root
cd template-projects
yarn install
```

---

## Build Commands

### Build All (Shared + Games)

```bash
cd template-projects
yarn build:all
```

This builds shared libraries first, then all game templates.

### Build Shared Libraries Only

```bash
cd template-projects
yarn build:shared
```

Run this **before** developing if you're using shared components.

### Build Individual Games

```bash
cd template-projects
yarn build:group-sort
yarn build:balloon-letter-picker
yarn build:labelled-diagram
yarn build:pair-matching
yarn build:plane-quiz
yarn build:whack-a-mole
yarn build:word-search
```

Or from within a game folder:
```bash
cd group-sort
yarn build
```

---

## Creating New Shared Libraries

The `shared/tutorial-viewer` serves as a **scaffold** for future shared components. To create a new shared library:

### 1. Copy the Scaffold

```bash
cd template-projects/shared
cp -r tutorial-viewer your-component-name
```

### 2. Update package.json

```json
{
  "name": "@minigame/your-component-name",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.umd.js",
  "module": "./dist/index.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js"
    }
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

### 3. Key Configuration

The scaffold uses **`vite-plugin-css-injected-by-js`** to bundle CSS into the JavaScript output. This means:

- ✅ **No CSS imports needed** in consuming projects
- ✅ **No vite config changes** in consuming projects
- ✅ **Single import** is all that's needed: `import { YourComponent } from "@minigame/your-component"`

### 4. Update Your Component

Replace the component code in `src/` with your own. Keep these patterns:

- Use CSS Modules (`.module.css`) for scoped styles
- Export from `src/index.ts`
- Build produces output in `dist/`

### 5. Register in Workspace

Add to root `package.json` workspaces (already includes `shared/*`):

```json
{
  "workspaces": [
    "shared/*",
    "group-sort",
    "...other games"
  ]
}
```

The workspace automatically includes all packages in `shared/*`.

---

## Adding a New Game Template

Follow these steps to add a new game template:

### Step 1: Create the Game Project

Copy an existing template as a starting point:

```bash
cd template-projects
cp -r group-sort my-new-game
```

### Step 2: Update package.json

Edit `my-new-game/package.json`:

```json
{
  "name": "my-new-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    // ... your dependencies
  },
  "packageManager": "yarn@4.13.0"
}
```

> ⚠️ **Important:** The `"name"` field **must match the folder name** exactly.

### Step 3: Register in Workspace

Edit `template-projects/package.json` and add your game to `workspaces`:

```json
{
  "name": "minigame-templates",
  "private": true,
  "workspaces": [
    "shared/*",
    "group-sort",
    "balloon-letter-picker",
    "labelled-diagram",
    "pair-matching",
    "plane-quiz",
    "whack-a-mole",
    "word-search",
    "my-new-game"
  ],
  "scripts": {
    "build:shared": "yarn workspaces foreach -p --include '@minigame/*' run build",
    "build:all": "yarn build:shared && yarn workspaces foreach -p --exclude '@minigame/*' --exclude 'minigame-templates' run build",
    "build:group-sort": "yarn workspace group-sort run build",
    "build:balloon-letter-picker": "yarn workspace balloon-letter-picker run build",
    "build:labelled-diagram": "yarn workspace labelled-diagram run build",
    "build:pair-matching": "yarn workspace pair-matching run build",
    "build:plane-quiz": "yarn workspace plane-quiz run build",
    "build:whack-a-mole": "yarn workspace whack-a-mole run build",
    "build:word-search": "yarn workspace word-search run build",
    "build:my-new-game": "yarn workspace my-new-game run build"
  },
  "packageManager": "yarn@4.13.0"
}
```

Add a new script for your game:
```json
"build:my-new-game": "yarn workspace my-new-game run build"
```

### Step 4: Install Dependencies

```bash
cd template-projects
yarn install
```

### Step 5: Create meta.json

Create `my-new-game/meta.json`:

```json
{
  "name": "My New Game",
  "description": "A fun educational game.",
  "gameType": "my-new-game",
  "version": "1.0.0"
}
```

Optionally add `thumbnail.png` for the home screen.

### Step 6: Register in build-templates.sh

Edit the root `build-templates.sh` and add your game to the `GAMES` array:

```bash
GAMES=(
  "group-sort|group-sort"
  "plane-quiz|plane-quiz"
  "balloon-letter-picker|balloon-letter-picker"
  "pair-matching|pair-matching"
  "word-search|word-search"
  "whack-a-mole|whack-a-mole"
  "my-new-game|my-new-game"  # Add this line
)
```

### Step 7: Register in CI/CD

Edit `.github/workflows/build-all.yml` and add your game to the build matrix.

### Step 8: Test

```bash
cd template-projects
yarn build:my-new-game
```

---

## Overview

Each subdirectory here is a complete, independent web application that:

- Uses **any tooling** you prefer (Vite, Webpack, Rollup, etc.)
- Builds to a **single `index.html`** file (via `vite-plugin-singlefile` or equivalent)
- Reads teacher-created data from `window.APP_DATA` at runtime
- Works completely offline in any browser

## Recommended Starting Point

**Use `group-sort/` as your template.** It's configured with:

- ✅ Vite + React 19
- ✅ React Compiler (automatic memoization)
- ✅ `vite-plugin-singlefile` for single-file output
- ✅ Proper `window.APP_DATA` integration
- ✅ Modern best practices

Copy it to start:

```bash
cp -r template-projects/group-sort template-projects/my-new-game
```

## Tooling is Unrestricted

While `group-sort` uses Vite + React, you can use **anything**:

- Vue, Svelte, Angular, Solid
- Vanilla JavaScript
- Preact, Alpine.js
- Any build tool (Vite, Webpack, Parcel, esbuild)

**Only the build output matters** (see requirements below).

## Requirements

### Build Output

Your template must produce:

| File                 | Requirement                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `index.html`         | **Single-file HTML** — all JS/CSS inlined. Use `vite-plugin-singlefile` or equivalent. |
| `images/` (optional) | Image assets that can't be inlined. Keep minimal.                                      |

> ⚠️ **No other assets.** Fonts, icons, small SVGs should be inlined into the HTML.

### Runtime Data Contract

The builder injects teacher data before the first `<script>` tag:

```html
<script>
  window.APP_DATA = {
    /* teacher's data */
  };
  window.MY_APP_DATA = window.APP_DATA; // legacy alias
  window.win = { DATA: window.APP_DATA }; // legacy alias
</script>
```

Your game reads `window.APP_DATA` at startup. The shape is up to you!

### `meta.json`

Each template must have a `meta.json` at the root level:

```json
{
  "name": "Human-readable Game Name",
  "description": "One sentence shown on the home screen.",
  "gameType": "your-game-id",
  "version": "1.0.0"
}
```

Optionally add `thumbnail.png` for the home screen thumbnail.

---

## Development Workflow

### 1. Develop Your Game

```bash
cd template-projects/group-sort
yarn install
yarn dev
```

Your game should work standalone in the browser during development.

### 2. Test with Mock Data

In your browser console, set mock data:

```javascript
window.APP_DATA = {
  // Your game's data structure
  items: [{ id: "1", text: "Hello" }],
};
```

### 3. Build and Test in Builder

```bash
# From template-projects root
yarn build:all

# Run the builder
cd ../builder-projects/electron-app-mui
yarn dev
```

### 4. Verify Integration

- [ ] Game appears on builder home screen
- [ ] Creating a project works
- [ ] Editor can modify data
- [ ] Preview shows your game with data
- [ ] Export produces working standalone game

---

## For AI Chatbots

**Context**: This directory (`template-projects/`) contains the **source code** for all game templates. Each is an independent web application with its own `package.json`, dependencies, and build process.

**Important**: The built output lives in `builder-projects/electron-app-mui/templates/<game-id>/game/`. Those folders contain **only minified/bundled `index.html` files** (and optionally an `images/` folder). There is no useful source code to read in those build output folders — they exist solely for runtime use by the Electron app. **Always read from `template-projects/<game-id>/`** to understand the game logic and source code. Reading the `game/` folder contents will waste your context window with minified code.

**Key Files** (in each `template-projects/<game-id>/` folder):

- `meta.json` — Template registration (name, description, gameType)
- `vite.config.ts` — Build configuration
- `src/` — Game source code
- `images/` — Game assets

**Build Command**: `yarn build` (in each template directory)

**Output**: Single `index.html` + `images/` folder (copied to `builder-projects/electron-app-mui/templates/`)

---

## Troubleshooting

### "Workspace not found" error

**Cause:** A `yarn.lock` file exists in your game folder, making Yarn treat it as the project root.

**Solution:**
```bash
# Remove the conflicting yarn.lock
rm group-sort/yarn.lock

# Reinstall from workspace root
cd template-projects
yarn install
```

### "Module not found: @minigame/tutorial-viewer"

**Cause:** Shared libraries haven't been built yet.

**Solution:**
```bash
cd template-projects
yarn build:shared
```

### TypeScript can't find types

**Solution:** Restart the TypeScript server in your IDE:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Changes to shared components don't appear

**Remember:** Shared libraries must be rebuilt after changes:
```bash
cd template-projects/shared/tutorial-viewer
yarn build
```

Then restart your game's dev server.

---

## Resources

- [Root README](../../README.md) - Main project documentation
- [Tutorial Viewer README](shared/tutorial-viewer/README.md) - Component usage guide
