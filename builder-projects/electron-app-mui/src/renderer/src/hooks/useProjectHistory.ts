import { applyPatch, compare, Operation } from 'fast-json-patch'
import { useCallback, useState } from 'react'
import log from 'electron-log/renderer'

const MAX_HISTORY = 50

export interface HistoryState<T> {
  present: T
  canUndo: boolean
  canRedo: boolean
  push: (next: T) => void
  undo: () => void
  redo: () => void
  reset: (next: T) => void
  past: Operation[][]
  future: Operation[][]
  getReachableStates: () => T[]
}

/**
 * Applies a list of JSON Patch operations to a base object.
 */
export function applyJSONPatch<T>(base: T, ops: Operation[]): T {
  // fast-json-patch can mutate, so we clone first
  const cloned = JSON.parse(JSON.stringify(base))
  return applyPatch(cloned, ops).newDocument
}

/**
 * Inverts a JSON Patch set. Note: Inverting JSON Patch is complex if
 * previous values aren't stored. However, for 'replace' and 'remove',
 * we can often find the old value if we specifically track it or use
 * a diffing tool that provides it.
 *
 * Fortunately, fast-json-patch 'compare' doesn't provide 'oldValue'
 * automatically in the RFC 6902 sense, but we can generate inverses
 * by diffing backwards.
 */

export function useProjectHistory<T extends object>(
  initial: T,
  initialPast: Operation[][] = [],
  initialFuture: Operation[][] = []
): HistoryState<T> {
  const [past, setPast] = useState<Operation[][]>(initialPast)
  const [present, setPresent] = useState<T>(initial)
  const [future, setFuture] = useState<Operation[][]>(initialFuture)

  const push = useCallback(
    (next: T) => {
      const ops = compare(present, next)
      if (ops.length === 0) return

      log.debug('useProjectHistory: pushing new state', ops)

      setPast((p) => {
        const appended = [...p, ops]
        if (appended.length > MAX_HISTORY) return appended.slice(appended.length - MAX_HISTORY)
        return appended
      })
      setPresent(next)
      setFuture([])
    },
    [present]
  )

  const undo = useCallback(() => {
    if (past.length === 0) return
    log.info('useProjectHistory: undo')

    // To undo with JSON patch robustly, we reconstruct the previous state
    // by playing history from the beginning or storing inverse patches.
    // For simplicity and correctness with RFC 6902, we reconstruct from start or previous points.

    const allPast = [...past]
    const lastOpSet = allPast.pop()!

    // Reconstruct previous state from scratch (or use a more optimized approach)
    // Here we'll just reconstruct the entire stack for safety
    let state = initial
    for (const ops of allPast) {
      state = applyJSONPatch(state, ops)
    }

    setFuture((f) => [lastOpSet, ...f])
    setPresent(state)
    setPast(allPast)
  }, [past, initial])

  const redo = useCallback(() => {
    if (future.length === 0) return
    log.info('useProjectHistory: redo')

    const ops = future[0]
    const nextPresent = applyJSONPatch(present, ops)

    setPast((p) => [...p, ops])
    setPresent(nextPresent)
    setFuture((f) => f.slice(1))
  }, [future, present])

  const reset = useCallback((next: T) => {
    log.info('useProjectHistory: reset')
    setPast([])
    setPresent(next)
    setFuture([])
  }, [])

  const getReachableStates = useCallback(() => {
    // Reachable equals all points in past + present + future
    let walk = initial
    const states: T[] = [walk]

    // Past states
    for (const ops of past) {
      walk = applyJSONPatch(walk, ops)
      states.push(walk)
    }

    // Future states
    walk = present
    for (const ops of future) {
      walk = applyJSONPatch(walk, ops)
      states.push(walk)
    }

    return states
  }, [initial, past, present, future])

  return {
    present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    push,
    undo,
    redo,
    reset,
    past,
    future,
    getReachableStates
  }
}
