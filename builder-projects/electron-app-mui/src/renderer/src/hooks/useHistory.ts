import { useState, useCallback } from 'react'

const MAX_HISTORY = 50

export interface HistoryState<T> {
  present: T
  canUndo: boolean
  canRedo: boolean
  push: (next: T) => void
  undo: () => void
  redo: () => void
  /** Replace present without recording an undo step (e.g. initial load) */
  reset: (next: T) => void
}

/**
 * Simple snapshot-based undo/redo. Each call to push() saves current
 * present to past and sets next as present. No diffing — just state copies.
 */
export function useHistory<T>(initial: T): HistoryState<T> {
  const [past, setPast] = useState<T[]>([])
  const [present, setPresent] = useState<T>(initial)
  const [future, setFuture] = useState<T[]>([])

  const push = useCallback(
    (next: T) => {
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), present])
      setPresent(next)
      setFuture([])
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [present]
  )

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p
      const prev = p[p.length - 1]
      setFuture((f) => [present, ...f])
      setPresent(prev)
      return p.slice(0, -1)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setPast((p) => [...p, present])
      setPresent(next)
      return f.slice(1)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present])

  const reset = useCallback((next: T) => {
    setPast([])
    setPresent(next)
    setFuture([])
  }, [])

  return { present, canUndo: past.length > 0, canRedo: future.length > 0, push, undo, redo, reset }
}
