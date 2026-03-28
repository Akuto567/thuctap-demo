# Minigame Builder (Electron App)

The **Minigame Builder** is an Electron-based desktop application that allows non-technical English teachers to create custom classroom minigames without writing any code. Teachers fill in words, questions, images, and other content through a visual editor, then export a self-contained game they can open directly in any browser.

This document provides a comprehensive guide to the builder's **architecture, code structure, TypeScript type system, IPC patterns, and editor implementation**.

---

## ⚠️ Important: Read This First

**This README focuses on the Electron app's internal codebase.** For the complete project workflow, see:

| Document                                       | Purpose                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Root README](../../README.md)                 | **Start here** — Complete system overview, game template requirements, build workflow, CI/CD, packaging |
| This README                                    | Deep dive into the Electron app codebase — Architecture, types, IPC, editor patterns                    |
| [Root README (Vietnamese)](../../README_vi.md) | Bản tiếng Việt của Root README                                                                          |

> 💡 **Why two READMEs?** The builder app is only one part of the system. Game templates live separately in `template-projects/` and have their own build process. The root README covers the **complete workflow** (building templates, CI/CD, packaging). This README covers the **builder app's codebase** (TypeScript architecture, IPC system, editor implementation).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [TypeScript Type System](#typescript-type-system)
- [IPC Communication (Type-Safe)](#ipc-communication-type-safe)
- [Data Flow](#data-flow)
- [Adding a New Game](#adding-a-new-game)
- [Development Workflow](#development-workflow)
- [Common Patterns and Best Practices](#common-patterns-and-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The builder follows the standard Electron three-process architecture:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Main Process   │◄───────►│  Preload Script │◄───────►│  Renderer       │
│  (Node.js)      │  IPC    │  (Context       │  IPC    │  (React App)    │
│                 │         │   Isolation)    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Main Process

- Electron's main entry point
- Handles file system operations, dialogs, and native OS features
- Manages IPC handlers for all renderer requests
- Performs data transforms for game templates

### Preload Script

- Runs in a privileged context with access to both Node.js and renderer APIs
- Exposes a typed `electronAPI` to the renderer via `contextBridge`
- **Does not** contain business logic—only IPC invocation wrappers

### Renderer Process

- React + TypeScript application with Material-UI components
- Provides the visual editor UI for each game type
- Invokes IPC methods via `window.electronAPI`
- Manages project state, undo/redo, and auto-save

---

## Project Structure

```
electron-app-mui/
├── src/
│   ├── main/                          # Main process code
│   │   ├── index.ts                   # Entry point + IPC handler registrations
│   │   ├── gameRegistry.ts            # Data transforms for game templates
│   │   └── ipc-handlers.ts            # Typed IPC handler utilities
│   │
│   ├── preload/                       # Preload script (context isolation)
│   │   ├── index.ts                   # Exposes electronAPI to renderer
│   │   └── index.d.ts                 # TypeScript declarations for electronAPI
│   │
│   ├── shared/                        # ⭐ SHARED TYPES (single source of truth)
│   │   ├── types.ts                   # All AppData types + IPC channel definitions
│   │   └── index.ts                   # Re-exports for convenient importing
│   │
│   └── renderer/src/                  # React application
│       ├── games/
│       │   ├── registry.ts            # Game editor registry
│       │   ├── group-sort/            # Per-game editor components
│       │   ├── plane-quiz/
│       │   └── ...
│       ├── components/                # Shared UI components
│       ├── context/                   # React contexts (Settings, Project)
│       ├── hooks/                     # Custom React hooks
│       ├── pages/                     # Route pages (Home, Project)
│       ├── types/                     # Re-exports from ../../shared
│       └── utils/                     # Utility functions
│
├── templates/                         # Built game templates (injected at build)
│   ├── group-sort/
│   │   ├── game/                      # Built game output (index.html + images)
│   │   └── meta.json                  # Template metadata
│   └── ...
│
├── tsconfig.json                      # Root TypeScript config
├── tsconfig.node.json                 # TypeScript config for main/preload
├── tsconfig.web.json                  # TypeScript config for renderer
└── electron.vite.config.ts            # Vite config for Electron builds
```

### Key Design Principle: Single Source of Truth

All type definitions flow from `src/shared/types.ts`. This eliminates duplication and ensures type safety across all three Electron layers.

---

## TypeScript Type System

### Shared Types Module (`src/shared/types.ts`)

This file is the **single source of truth** for all types used across the application:

1. **AppData Types**: Define the shape of project data for each game
   - `GroupSortAppData`, `QuizAppData`, `BalloonLetterPickerAppData`, etc.
   - Used by both main process (transforms) and renderer (editors)

2. **IPC Channel Definitions**: Define all IPC channels with their handler signatures
   - `IPCChannelDefinitions` interface maps channel names to handler types
   - Includes the `IpcMainInvokeEvent` parameter for main process handlers

3. **Common Types**: `GameTemplate`, `ProjectFile`, `GlobalSettings`, etc.

### Type Helpers

```typescript
// Extract the handler function type for a channel
export type IPCHandler<T extends keyof IPCChannelDefinitions> = IPCChannelDefinitions[T]['handler']

// Extract renderer-side invoke arguments (excludes IpcMainInvokeEvent)
export type RendererInvokeArgs<T extends keyof IPCChannelDefinitions> =
  IPCChannelDefinitions[T]['handler'] extends (
    event: IpcMainInvokeEvent,
    ...args: infer U
  ) => unknown
    ? U
    : IPCChannelDefinitions[T]['handler'] extends () => unknown
      ? []
      : Parameters<IPCChannelDefinitions[T]['handler']>

// Extract the return type of an IPC handler
export type IPCReturn<T extends keyof IPCChannelDefinitions> = ReturnType<IPCHandler<T>>
```

### Import Paths

```typescript
// ✅ Recommended: Import directly from shared
import type { GroupSortAppData, IPCChannels } from '../../shared'

// ✅ Also works: Import via renderer/types (re-exports shared)
import type { GroupSortAppData } from '../types'

// ❌ Avoid: Importing from main or preload (breaks layer isolation)
import type { ... } from '../../main/...'
```

---

## IPC Communication (Type-Safe)

### Overview

The IPC system is fully type-safe thanks to centralized channel definitions. When you add or modify an IPC channel, types are automatically enforced in:

- Main process handler implementation
- Preload script invocation
- Renderer usage

### Channel Definition Format

Each channel is defined in `IPCChannelDefinitions` with its **main process handler signature**:

```typescript
export interface IPCChannelDefinitions {
  'check-folder-status': {
    handler: (event: IpcMainInvokeEvent, folderPath: string) => Promise<FolderStatus>
  }
}
```

**Important**: The first parameter is always `IpcMainInvokeEvent` (automatically provided by Electron). The renderer does NOT pass this event.

### Main Process: Registering a Handler

```typescript
// src/main/index.ts
import { createHandler } from './ipc-handlers'

createHandler('check-folder-status', async (_event, folderPath: string) => {
  return checkFolderStatus(folderPath)
})
```

**Key points**:

- Use `createHandler(channel, handler)` for type inference
- The handler signature must match the definition in `IPCChannelDefinitions`
- TypeScript will enforce correct parameter types and return type

### Preload Script: Exposing the API

```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  checkFolderStatus: (folderPath: string) =>
    typedIpcRenderer.invoke('check-folder-status', folderPath)
})
```

**Key points**:

- `typedIpcRenderer.invoke` automatically excludes the `IpcMainInvokeEvent` parameter
- Arguments and return type are inferred from the channel definition

### Renderer: Using the API

```typescript
// In a React component
const status = await window.electronAPI.checkFolderStatus('/some/path')
// status is typed as FolderStatus ('empty' | 'has-project' | 'non-empty')
```

**Key points**:

- Full autocomplete and type checking
- No need to remember channel strings (use `IPCChannels` constant if needed)

### Available IPC Channels

| Channel                 | Purpose                                     | Parameters                                        | Returns                  |
| ----------------------- | ------------------------------------------- | ------------------------------------------------- | ------------------------ |
| `get-templates`         | List available game templates               | none                                              | `GameTemplate[]`         |
| `check-folder-status`   | Check if folder is suitable for new project | `folderPath: string`                              | `FolderStatus`           |
| `choose-project-folder` | Open folder picker dialog                   | none                                              | `string \| null`         |
| `open-project-file`     | Load a `.mgproj` file                       | `filePath?: string`                               | `ProjectFile \| null`    |
| `save-project`          | Save project to disk                        | `data: object, projectPath: string`               | `boolean`                |
| `preview-project`       | Open game preview window                    | `opts: { templateId, appData, projectDir }`       | `{ success: boolean }`   |
| `export-project`        | Export standalone game                      | `opts: { templateId, appData, projectDir, mode }` | Export result            |
| `pick-image`            | Open image picker dialog                    | none                                              | `string \| null`         |
| `import-image`          | Copy image to project assets                | `sourcePath, projectDir, desiredNamePrefix`       | `string` (relative path) |
| `settings-read-global`  | Load global settings                        | none                                              | `GlobalSettings`         |
| `settings-write-global` | Save global settings                        | `data: GlobalSettings`                            | `boolean`                |

---

## Data Flow

### Project Data Lifecycle

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Editor (UI)    │─────►│  Project State  │─────►│  Save to Disk   │
│  (onChange)     │      │  (Context)      │      │  (IPC: save)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Preview/Export │
                       │  (Data Transform)│
                       └─────────────────┘
```

### Data Transforms (`src/main/gameRegistry.ts`)

Some games require data transformation before runtime injection. For example:

- `balloon-letter-picker`: Flattens `{ words: [...] }` to a plain array
- `pair-matching`: Renames `imagePath` → `image`
- `whack-a-mole`: Renames `id` → `groupId`

**Adding a transform**:

```typescript
export const GAME_DATA_TRANSFORMS: Record<string, DataTransform> = {
  'my-new-game': (appData) => {
    const data = appData as MyNewGameAppData
    // Transform to runtime shape
    return { items: data.items.map(({ text }) => ({ text })) }
  }
}
```

**Important**: The transform function receives the **internal** `AnyAppData` type and returns the **runtime** shape expected by the game template.

---

## Adding a New Game

This is the most common extension task.

> 📚 **For complete workflow instructions** (including build script registration, CI configuration, and testing), see [Root README — Adding a New Game](../../README.md#adding-a-new-game---quick-start).

This section focuses on the **builder app code changes** required when adding a new game.

### Overview

| Step | Task                               | Location                                            |
| ---- | ---------------------------------- | --------------------------------------------------- |
| 1    | Create game template               | `template-projects/` (see Root README)              |
| 2    | Register in build script           | `build-templates.sh` (see Root README)              |
| 3    | Register in CI                     | `.github/workflows/build-all.yml` (see Root README) |
| 4    | **Define AppData types**           | `src/shared/types.ts` (this README)                 |
| 5    | **Create editor component**        | `src/renderer/src/games/<game-id>/` (this README)   |
| 6    | **Register editor**                | `src/renderer/src/games/registry.ts` (this README)  |
| 7    | **Add data transform (if needed)** | `src/main/gameRegistry.ts` (this README)            |

### Step 4: Define AppData Types

Edit `src/shared/types.ts`:

```typescript
// ── My New Game ───────────────────────────────────────────────────────────────
export interface MyNewGameItem {
  id: string
  text: string
}
export interface MyNewGameAppData {
  items: MyNewGameItem[]
  _itemCounter: number
}

// Add to AnyAppData union:
export type AnyAppData =
  | GroupSortAppData
  | QuizAppData
  // ... existing types ...
  | MyNewGameAppData // ← Add this line
```

### Step 5: Create the Editor Component

Create `src/renderer/src/games/my-new-game/MyNewGameEditor.tsx`:

```typescript
import type { MyNewGameAppData } from '../../types'

interface Props {
  appData: MyNewGameAppData
  projectDir: string
  onChange: (data: MyNewGameAppData) => void
}

export default function MyNewGameEditor({ appData, projectDir, onChange }: Props) {
  // Your editor UI here
  // Call onChange with new data when user makes changes

  return (
    <div>
      {/* Editor UI */}
    </div>
  )
}
```

**Key requirements**:

- Accept `appData`, `projectDir`, and `onChange` props
- Call `onChange` with a **new immutable copy** of `appData` on every change
- Use shared components from `src/renderer/src/components/EditorShared`
- Use `ImagePicker` for image selection

### Step 6: Register the Editor

Edit `src/renderer/src/games/registry.ts`:

```typescript
import MyNewGameEditor from './my-new-game/MyNewGameEditor'

export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  // ... existing entries ...

  'my-new-game': {
    Editor: MyNewGameEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      items: [],
      _itemCounter: 0
    })
  }
}
```

**Important**: `createInitialData` must return a valid **empty** `MyNewGameAppData` that your editor can render without crashing.

### Step 7: Add Data Transform (If Needed)

If your game's runtime shape differs from the stored shape, edit `src/main/gameRegistry.ts`:

```typescript
export const GAME_DATA_TRANSFORMS: Record<string, DataTransform> = {
  // ... existing transforms ...

  'my-new-game': (appData) => {
    const data = appData as MyNewGameAppData
    // Return runtime shape
    return data.items.map(({ text }) => ({ text }))
  }
}
```

If the shapes are identical, skip this step.

### Step 8: Test Locally

```bash
# Build the template
./build-templates.sh my-new-game

# Run the builder
cd builder-projects/electron-app-mui
yarn dev
```

**Checklist**:

- [ ] Game appears on home screen with correct name/description
- [ ] Creating a new project opens the editor without errors
- [ ] Editing content, saving, closing, and re-opening works correctly
- [ ] Preview opens the game with data loaded
- [ ] Export (folder and ZIP) produces a working standalone game

---

## Development Workflow

### Prerequisites

- **Node.js** 20+
- **Yarn** 4 (`corepack enable && corepack prepare yarn@4.12.0 --activate`)

### Initial Setup

```bash
# Install dependencies
cd builder-projects/electron-app-mui
yarn install

# Build all game templates (from repo root)
./build-templates.sh
```

### Development Mode

```bash
# Terminal 1: Run the builder in dev mode
cd builder-projects/electron-app-mui
yarn dev

# Terminal 2 (optional): Watch a specific game template
cd template-projects/group-sort
yarn dev
```

The builder will hot-reload when you change renderer code. Game template changes require rebuilding:

```bash
./build-templates.sh group-sort
```

### Using Context from Existing Editors

When creating a new editor, study existing ones for patterns:

1. **State Management**: Use controlled components with `onChange` callbacks
2. **Shared Components**: Reuse `EditorShared` for tabs, counters, list editors
3. **Image Handling**: Use `ImagePicker` and the `importImage` IPC method
4. **Undo/Redo**: The project context handles this automatically—just call `onChange` with new data

Example pattern:

```typescript
function handleAddItem() {
  const newItem: MyNewGameItem = {
    id: crypto.randomUUID(),
    text: ''
  }
  onChange({
    ...appData,
    items: [...appData.items, newItem],
    _itemCounter: appData._itemCounter + 1
  })
}
```

### Debugging

**Main Process**:

- Logs appear in the terminal running `yarn dev`
- Use `console.log()` in `src/main/index.ts`

**Renderer**:

- Open DevTools (automatically opens in dev mode)
- Use React DevTools for component inspection

**Preview Window**:

- DevTools open automatically for preview windows
- `window.__PREVIEW_DEBUG__` contains session info in dev mode

---

## Building and Distribution

### Build Commands

```bash
# Typecheck first
yarn typecheck

# Build for current platform
yarn build

# Build for specific platforms
yarn build:win      # Windows (7z)
yarn build:mac      # macOS (dmg)
yarn build:linux    # Linux (AppImage)
```

### Build Process

1. TypeScript compilation (main, preload, renderer)
2. Vite bundles the renderer with inlined assets
3. Electron Builder packages the app
4. Game templates from `templates/` are included as extra resources

### Distribution

Built artifacts appear in `dist/`:

- Windows: `electron-app-1.0.0-win32-x64/`
- macOS: `electron-app-1.0.0.dmg`
- Linux: `electron-app-1.0.0.AppImage`

---

## Common Patterns and Best Practices

### Immutable State Updates

Always create new objects when calling `onChange`:

```typescript
// ✅ Correct
onChange({
  ...appData,
  items: [...appData.items, newItem]
})

// ❌ Wrong (mutates existing state)
appData.items.push(newItem)
onChange(appData)
```

### Counter Pattern

Use `_itemCounter` (or similar) to generate unique IDs:

```typescript
const newItem = {
  id: `item-${appData._itemCounter}`
  // ...
}
onChange({
  ...appData,
  items: [...appData.items, newItem],
  _itemCounter: appData._itemCounter + 1
})
```

### Asset Path Resolution

Images are stored relative to the project directory:

```typescript
// In editor
const relativePath = await window.electronAPI.importImage(sourcePath, projectDir, 'item-image')

// In game template (runtime)
const imagePath = `./${item.imagePath}`
```

### Settings Storage

Global settings are stored in Electron's `userData` directory:

```typescript
// Read
const settings = await window.electronAPI.settingsReadGlobal()

// Write
await window.electronAPI.settingsWriteGlobal({
  ...settings,
  autoSave: { mode: 'on-edit', intervalSeconds: 30 }
})
```

---

> ⚠️ **Note for AI Chatbots**: The `templates/` folder in this project contains **built and minified output** only. Each `<game-id>/game/` subfolder contains a single bundled `index.html` file (and optionally an `images/` folder). There are no source code files to read in these build output folders — they exist solely for runtime use by the Electron app. For understanding the game logic and source code, read the files in `template-projects/<game-id>/` instead. Reading the `game/` folder contents will waste your context window with minified/bundled code.

## Troubleshooting

### "Module not found" Errors

Ensure you're importing from the correct path:

- Renderer → `../../shared` or `../types`
- Main → `../shared`
- Preload → `../shared`

### Type Errors After Adding a Game

1. Run `yarn typecheck` to see specific errors
2. Ensure your `AnyAppData` union includes the new type
3. Check that `createInitialData` returns the correct shape

### Preview Window Shows Blank

1. Check the DevTools console for errors
2. Verify `window.APP_DATA` is injected (check HTML source)
3. Ensure the game template's build output is in `templates/<game-id>/game/`

### IPC Handler Not Being Called

1. Verify the channel name matches exactly (use `IPCChannels` constant)
2. Check that `createHandler` is called in `src/main/index.ts`
3. Ensure the preload script exposes the method

### Build Fails with "Template not found"

Run `./build-templates.sh` from the repo root to ensure all templates are built and copied.

---

## Architecture Decision Records (ADRs)

### ADR-001: Centralized Type Definitions

**Decision**: All types are defined in `src/shared/types.ts` and imported by main, preload, and renderer.

**Rationale**:

- Eliminates duplication (previously AppData types were defined twice)
- Ensures type safety across IPC boundaries
- Single source of truth makes refactoring easier

### ADR-002: Typed IPC Handlers

**Decision**: Use `createHandler(channel, handler)` with inferred types from `IPCChannelDefinitions`.

**Rationale**:

- Prevents channel name typos
- Enforces correct handler signatures
- Autocomplete in IDE
- Changing a channel definition automatically updates all usages

### ADR-003: Data Transforms in Main Process

**Decision**: Game-specific data transforms live in `src/main/gameRegistry.ts`.

**Rationale**:

- Keeps renderer code clean and game-agnostic
- Transforms are applied consistently for preview and export
- Game templates can evolve independently of editor structure

---

## Future Improvements

- [ ] Add plugin system for third-party game templates
- [ ] Implement project templates (pre-filled content)
- [ ] Add cloud sync for projects
- [ ] Support for custom CSS/themes in exported games
- [ ] Localization system for editor UI

---

## License

[Your License Here]
