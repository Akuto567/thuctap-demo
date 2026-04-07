/**
 * Hook for Balloon Letter Picker entity CRUD operations.
 * Manages word creation, updates, and deletion with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback } from 'react'
import { BalloonLetterPickerAppData, BalloonWord } from '@renderer/types'
import { toBb26 } from '@renderer/utils'

interface UseBalloonCrudReturn {
  words: BalloonWord[]
  addWord: (initialImagePath?: string) => void
  addWordFromDrop: (filePath: string) => Promise<void>
  updateWord: (id: string, patch: Partial<BalloonWord>) => void
  deleteWord: (id: string) => void
}

/**
 * Provides CRUD operations for balloon letter picker words.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function useBalloonCrud(
  data: BalloonLetterPickerAppData,
  projectDir: string,
  onChange: (data: BalloonLetterPickerAppData) => void
): UseBalloonCrudReturn {
  const { resolved } = useSettings()
  const { words } = data

  const addWord = useCallback(
    (initialImagePath?: string) => {
      const c = data._wordCounter + 1
      const w: BalloonWord = {
        id: `word-${c}`,
        word: resolved.prefillNames ? `WORD${toBb26(c)}` : '',
        imagePath: initialImagePath ?? null,
        hint: resolved.prefillNames ? `Hint ${c}` : ''
      }
      onChange({ ...data, _wordCounter: c, words: [...words, w] })
    },
    [data, words, resolved.prefillNames, onChange]
  )

  const addWordFromDrop = useCallback(
    async (filePath: string) => {
      const c = data._wordCounter + 1
      const id = `word-${c}`
      const relativePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const imagePath = `${relativePath.replace(/\\/g, '/')}`
      const w: BalloonWord = {
        id,
        word: resolved.prefillNames ? `WORD${toBb26(c)}` : '',
        imagePath,
        hint: ''
      }
      onChange({ ...data, _wordCounter: c, words: [...words, w] })
    },
    [data, words, projectDir, resolved.prefillNames, onChange]
  )

  const updateWord = useCallback(
    (id: string, patch: Partial<BalloonWord>) => {
      onChange({ ...data, words: words.map((w) => (w.id === id ? { ...w, ...patch } : w)) })
    },
    [data, words, onChange]
  )

  const deleteWord = useCallback(
    (id: string) => {
      onChange({ ...data, words: words.filter((w) => w.id !== id) })
    },
    [data, words, onChange]
  )

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addWord
  })

  return {
    words,
    addWord,
    addWordFromDrop,
    updateWord,
    deleteWord
  }
}
