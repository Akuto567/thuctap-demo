/**
 * History Utilities
 *
 * Pure functions for undo/redo history operations.
 */

import { AnyAppData } from '../types'

/**
 * Extracts the full history array from the zustand-travel history.
 * Returns deep copies to prevent accidental mutation of history state.
 *
 * @param history - History from getHistory() controls
 * @returns Array of AppData snapshots
 */
export function getHistoryArray(
  history: readonly ({ data: AnyAppData } | { getState: () => { data: AnyAppData } })[]
): AnyAppData[] {
  // Deep copy each entry to prevent mutation of history state
  // Entries may be either plain objects with data or StoreApi with getState()
  return history.map((entry) => {
    const data = 'getState' in entry ? entry.getState().data : entry.data
    return structuredClone(data)
  })
}
