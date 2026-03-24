/**
 * Game Registry — the single file to update when adding a new game.
 *
 * To add a new game:
 *  1. Build your game template project and add it under template-projects/<game-id>/
 *  2. Create your editor component at  games/<game-id>/<Name>Editor.tsx
 *  3. Import it below and add one entry to GAME_REGISTRY
 *  4. If the game needs a runtime data transform, also add it to
 *     src/main/gameRegistry.ts
 */

import type { ComponentType } from 'react'
import type { AnyAppData } from '../types'

import BalloonLetterPickerEditor from './balloon-letter-picker/BalloonLetterPickerEditor'
import GroupSortEditor from './group-sort/GroupSortEditor'
import PairMatchingEditor from './pair-matching/PairMatchingEditor'
import QuizEditor from './plane-quiz/QuizEditor'

export interface GameRegistryEntry {
  /** Editor component rendered on the ProjectPage */
  Editor: ComponentType<{
    appData: AnyAppData
    projectDir: string
    onChange: (data: AnyAppData) => void
  }>
  /** Returns a fresh, empty appData object for new projects */
  createInitialData: () => AnyAppData
}

// ── Add new games here ────────────────────────────────────────────────────────
export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  'group-sort': {
    Editor: GroupSortEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      groups: [],
      items: [],
      _groupCounter: 0,
      _itemCounter: 0
    })
  },

  'plane-quiz': {
    Editor: QuizEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      questions: [],
      _questionCounter: 0
    })
  },

  'balloon-letter-picker': {
    Editor: BalloonLetterPickerEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      words: [],
      _wordCounter: 0
    })
  },

  'pair-matching': {
    Editor: PairMatchingEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      items: [],
      _itemCounter: 0
    })
  }
}
