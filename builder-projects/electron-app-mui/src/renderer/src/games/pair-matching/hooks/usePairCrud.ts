/**
 * Hook for Pair Matching entity CRUD operations.
 * Manages pair item creation, updates, and deletion with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback } from 'react'
import { PairMatchingAppData, PairMatchingItem } from '@renderer/types'

interface UsePairCrudReturn {
  items: PairMatchingItem[]
  addItem: (initialImage?: string) => void
  addItemFromDrop: (filePath: string) => Promise<void>
  updateItem: (id: string, patch: Partial<PairMatchingItem>) => void
  deleteItem: (id: string) => void
}

/**
 * Provides CRUD operations for pair matching items.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function usePairCrud(
  data: PairMatchingAppData,
  projectDir: string,
  onChange: (data: PairMatchingAppData) => void
): UsePairCrudReturn {
  const { resolved } = useSettings()
  const { items } = data

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  const addItem = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextItemId()
      const i: PairMatchingItem = {
        id,
        keyword: resolved.prefillNames ? `Pair ${counter}` : '',
        imagePath: initialImage ?? null,
        minPairs: 1
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const i: PairMatchingItem = {
        id,
        keyword: resolved.prefillNames ? `Pair ${counter}` : '',
        imagePath
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<PairMatchingItem>) => {
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
