/**
 * Hook for Group Sort entity CRUD operations.
 * Manages both groups and items with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback } from 'react'
import { GroupSortAppData, GroupSortGroup, GroupSortItem } from '@renderer/types'

interface UseGroupSortCrudReturn {
  groups: GroupSortGroup[]
  items: GroupSortItem[]
  addGroup: (initialImage?: string) => void
  addGroupFromDrop: (filePath: string) => Promise<void>
  updateGroup: (id: string, patch: Partial<GroupSortGroup>) => void
  deleteGroup: (id: string) => void
  addItem: (groupId?: string, initialImage?: string) => void
  addItemFromDrop: (filePath: string, groupId?: string) => Promise<void>
  updateItem: (id: string, patch: Partial<GroupSortItem>) => void
  deleteItem: (id: string) => void
}

/**
 * Provides CRUD operations for group sort groups and items.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function useGroupSortCrud(
  data: GroupSortAppData,
  projectDir: string,
  onChange: (data: GroupSortAppData) => void
): UseGroupSortCrudReturn {
  const { resolved } = useSettings()
  const { groups, items } = data

  // ── ID generators ────────────────────────────────────────────────────────
  const nextGroupId = useCallback(() => {
    const c = data._groupCounter + 1
    return { id: `group-${c}`, counter: c }
  }, [data._groupCounter])

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  // ── Group CRUD ───────────────────────────────────────────────────────────
  const addGroup = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextGroupId()
      const g: GroupSortGroup = {
        id,
        name: resolved.prefillNames ? `Group ${counter}` : '',
        imagePath: initialImage ?? null
      }
      onChange({ ...data, _groupCounter: counter, groups: [...groups, g] })
    },
    [data, groups, resolved.prefillNames, onChange, nextGroupId]
  )

  const addGroupFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextGroupId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const g: GroupSortGroup = {
        id,
        name: resolved.prefillNames ? `Group ${counter}` : '',
        imagePath
      }
      onChange({ ...data, _groupCounter: counter, groups: [...groups, g] })
    },
    [data, groups, projectDir, resolved.prefillNames, onChange, nextGroupId]
  )

  const updateGroup = useCallback(
    (id: string, patch: Partial<GroupSortGroup>) => {
      onChange({ ...data, groups: groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
    },
    [data, groups, onChange]
  )

  const deleteGroup = useCallback(
    (id: string) => {
      onChange({
        ...data,
        groups: groups.filter((g) => g.id !== id),
        items: items.map((i) => (i.groupId === id ? { ...i, groupId: '' } : i))
      })
    },
    [data, groups, items, onChange]
  )

  // ── Item CRUD ────────────────────────────────────────────────────────────
  const addItem = useCallback(
    (groupId?: string, initialImage?: string) => {
      const { id, counter } = nextItemId()
      const targetGroupId = groupId ?? groups[groups.length - 1]?.id ?? ''
      const i: GroupSortItem = {
        id,
        name: resolved.prefillNames ? `Item ${counter}` : '',
        imagePath: initialImage ?? null,
        groupId: targetGroupId
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, groups, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string, groupId?: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const targetGroupId = groupId ?? groups[groups.length - 1]?.id ?? ''
      const i: GroupSortItem = {
        id,
        name: resolved.prefillNames ? `Item ${counter}` : '',
        imagePath,
        groupId: targetGroupId
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, groups, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<GroupSortItem>) => {
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
  // Tier 1 (Ctrl+N) = item (smallest unit) → last group
  // Tier 2 (Ctrl+Shift+N) = group (nothing above group)
  useEntityCreateShortcut({
    onTier1: addItem,
    onTier2: addGroup
  })

  return {
    groups,
    items,
    addGroup,
    addGroupFromDrop,
    updateGroup,
    deleteGroup,
    addItem,
    addItemFromDrop,
    updateItem,
    deleteItem
  }
}
