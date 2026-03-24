/**
 * Main-process Game Registry — the single file to update when a game needs a
 * runtime data transform before injection / export.
 *
 * To add a new game that requires a transform:
 *  1. Add an entry to GAME_DATA_TRANSFORMS keyed by the game's template id.
 *  2. The function receives the internal appData and must return the object /
 *     array that the game template expects via window.APP_DATA at runtime.
 *
 * If your game uses the same shape at runtime as in the project file, you don't
 * need an entry here — it will pass through as-is.
 */

export type DataTransform = (appData: object) => object

// ── Add transforms here ───────────────────────────────────────────────────────
export const GAME_DATA_TRANSFORMS: Record<string, DataTransform> = {
  'balloon-letter-picker': (appData) => {
    // Template expects a flat array of { word, imageUrl, hint }
    const data = appData as { words?: { word: string; imageUrl: string; hint: string }[] }
    return (data.words ?? []).map(({ word, imageUrl, hint }) => ({ word, imageUrl, hint }))
  },
  'group-sort': (appData) => {
    // This Template expects same object structure
    return appData
  },
  'plane-quiz': (appData) => {
    // This Template expects same object structure
    return appData
  }
}

/**
 * Apply any registered transform for the given templateId.
 * Falls back to the raw appData if no transform is registered.
 */
export function prepareAppDataForTemplate(templateId: string, appData: object): object {
  const transform = GAME_DATA_TRANSFORMS[templateId]
  return transform ? transform(appData) : appData
}
