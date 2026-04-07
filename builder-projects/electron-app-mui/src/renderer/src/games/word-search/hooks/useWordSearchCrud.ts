/**
 * Hook for Word Search entity CRUD operations.
 * Manages word creation, updates, and deletion with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback } from 'react'
import { WordSearchAppData, WordSearchItem } from '@renderer/types'
import { toBb26 } from '@renderer/utils'

interface UseWordSearchCrudReturn {
  items: WordSearchItem[]
  addItem: (initialImage?: string) => void
  addItemFromDrop: (filePath: string) => Promise<void>
  updateItem: (id: string, patch: Partial<WordSearchItem>) => void
  deleteItem: (id: string) => void
}

/**
 * Provides CRUD operations for word search items.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function useWordSearchCrud(
  data: WordSearchAppData,
  projectDir: string,
  onChange: (data: WordSearchAppData) => void
): UseWordSearchCrudReturn {
  const { resolved } = useSettings()
  const { items } = data

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  const addItem = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextItemId()
      const i: WordSearchItem = {
        id,
        word: resolved.prefillNames ? `WORD${toBb26(counter)}` : '',
        imagePath: initialImage ?? null
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const i: WordSearchItem = {
        id,
        word: resolved.prefillNames ? `WORD${toBb26(counter)}` : '',
        imagePath
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<WordSearchItem>) => {
      onChange({ ...data, items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
    },
    [data, items, onChange]
  )

  const deleteItem = useCallback(
    (id: string) => {
      onChange({ ...data, items: items.filter((i) => i.id !== id) })
    },
    [data, items, onChange]
  )

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addItem
  })

  return {
    items,
    addItem,
    addItemFromDrop,
    updateItem,
    deleteItem
  }
}
