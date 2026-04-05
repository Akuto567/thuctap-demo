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

import type {
  AnyAppData,
  BalloonLetterPickerAppData,
  FindTheTreasureAppData,
  GroupSortAppData,
  LabelledDiagramAppData,
  PairMatchingAppData,
  QuizAppData,
  WhackAMoleAppData,
  WordSearchAppData
} from '../shared'

export type DataTransform = (appData: AnyAppData) => object

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
    const data = appData as BalloonLetterPickerAppData
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
    const data = appData as GroupSortAppData

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
    const data = appData as QuizAppData

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
    const data = appData as PairMatchingAppData

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
  },

  // Word Search
  'word-search': (appData) => {
    // Template expects:
    // { items: { word: string, image: string }[], background?: string }
    const data = appData as WordSearchAppData

    const items = (data.items ?? []).map(({ word, imagePath }) => ({
      word,
      image: imagePath // rename imagePath to image
    }))

    return omitInternalKeys({
      items,
      background: data.backgroundImagePath ?? undefined
    })
  },

  // Whack-a-Mole
  'whack-a-mole': (appData) => {
    // Template expects:
    // {
    //   title: string,
    //   class: string,
    //   questions: [
    //     {
    //       groupId,
    //       question,
    //       questionImage,
    //       answerText,
    //       answerImage
    //     }
    //   ]
    // }
    // Internal format uses: id, question, questionImage, answerText, answerImage
    // Transform: id -> groupId (for compatibility with existing template)
    const data = appData as WhackAMoleAppData

    const questions = (data.questions ?? []).map(
      ({ id, question, questionImage, answerText, answerImage }) => ({
        groupId: id, // rename id to groupId for template compatibility
        question,
        questionImage,
        answerText,
        answerImage
      })
    )

    return omitInternalKeys({
      title: data.title,
      class: data.grade,
      questions
    })
  },

  // Labelled Diagram
  'labelled-diagram': (appData) => {
    // Template expects:
    // {
    //   imagePath: string,
    //   points: { id, text, xPercent, yPercent }[]
    // }
    const data = appData as LabelledDiagramAppData

    return omitInternalKeys({
      imagePath: data.imagePath,
      points: (data.points ?? []).map(({ id, text, xPercent, yPercent }) => ({
        id,
        text,
        xPercent,
        yPercent
      }))
    })
  },

  // Find the Treasure
  'find-the-treasure': (appData) => {
    // Template expects a flat Stage[] array:
    // { id, location, story, prompt, options: string[], correctAnswer: number, explanation, points }
    const data = appData as FindTheTreasureAppData
    const stages = (data.stages ?? []).map((s) => {
      const correctIndex = s.answers.findIndex((a) => a.isCorrect)
      const options = s.answers.map((a) => a.text)
      return {
        id: s.id,
        location: s.stageName,
        story: s.stageText,
        prompt: s.question,
        options,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        explanation: s.stageDescription,
        points: s.stageValue
      }
    })
    return omitInternalKeys(stages)
  }
}

/**
 * Apply any registered transform for the given templateId.
 * Falls back to the raw appData if no transform is registered.
 */
export function prepareAppDataForTemplate(templateId: string, appData: object): object {
  const transform = GAME_DATA_TRANSFORMS[templateId]
  return transform ? transform(appData as AnyAppData) : appData
}
