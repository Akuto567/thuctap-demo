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

// Helper to recursively remove any keys starting with an underscore
function omitInternalKeys(obj: object): object {
  if (Array.isArray(obj)) {
    return obj.map(omitInternalKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: object = {}
    for (const [k, v] of Object.entries(obj)) {
      if (!k.startsWith('_')) {
        newObj[k] = omitInternalKeys(v)
      }
    }
    return newObj
  }
  return obj
}

// ── Add transforms here ───────────────────────────────────────────────────────
export const GAME_DATA_TRANSFORMS: Record<string, DataTransform> = {
  // Balloon Letter Picker
  'balloon-letter-picker': (appData) => {
    // Template expects a flat array of { word, imageUrl, hint }
    const data = appData as { words?: { word: string; imagePath: string; hint: string }[] }
    return omitInternalKeys(
      (data.words ?? []).map(({ word, imagePath, hint }) => ({ word, imageUrl: imagePath, hint }))
    )
  },

  // Group Sort
  'group-sort': (appData) => {
    // Template expects:
    // {
    //   groups: { id, name, imagePath }[]
    //   items: { id, name, imagePath, groupId }[]
    // }
    const data = appData as {
      groups?: { id: string; name: string; imagePath: string | null }[]
      items?: { id: string; name: string; imagePath: string | null; groupId: string }[]
    }

    const groups = (data.groups ?? []).map(({ id, name, imagePath }) => ({
      id,
      name,
      imagePath
    }))

    const items = (data.items ?? []).map(({ id, name, imagePath, groupId }) => ({
      id,
      name,
      imagePath,
      groupId
    }))

    return omitInternalKeys({ groups, items })
  },

  // Plane Quiz
  'plane-quiz': (appData) => {
    // Template expects:
    // {
    //   questions: {
    //     id, question, imagePath, answers: { id, text, isCorrect }[], multipleCorrect
    //   }[]
    // }
    const data = appData as {
      questions?: {
        id: string
        question: string
        imagePath: string | null
        answers?: { id: string; text: string; isCorrect: boolean }[]
        multipleCorrect: boolean
      }[]
    }

    const questions = (data.questions ?? []).map(
      ({ id, question, imagePath, answers, multipleCorrect }) => ({
        id,
        question,
        imagePath,
        answers: (answers ?? []).map(({ id, text, isCorrect }) => ({
          id,
          text,
          isCorrect
        })),
        multipleCorrect
      })
    )

    return omitInternalKeys({ questions })
  },

  // Pair Matching
  'pair-matching': (appData) => {
    // Template expects:
    // {
    //   minTotalPairs?: number
    //   cardBackColor?: string
    //   cardBackImage?: string | null
    //   items: { id, image, keyword, minPairs? }[]
    // }
    // imagePath → image
    const data = appData as {
      items?: {
        id: string
        imagePath: string | null
        keyword: string
        minPairs?: number | null
      }[]
      minTotalPairs?: number | null
      cardBackColor?: string
      cardBackImage?: string | null
    }

    const items = (data.items ?? []).map(({ id, imagePath, keyword, minPairs }) => ({
      id,
      image: imagePath, // rename imagePath → image
      keyword,
      minPairs: minPairs ?? undefined
    }))

    return omitInternalKeys({
      minTotalPairs: data.minTotalPairs ?? undefined,
      cardBackColor: data.cardBackColor,
      cardBackImage: data.cardBackImage,
      items
    })
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
