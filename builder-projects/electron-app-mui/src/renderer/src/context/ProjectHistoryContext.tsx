import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createStore, useStore } from 'zustand'
import { travel } from 'zustand-travel'
import { AnyAppData } from '../types'

// ── Store Type ────────────────────────────────────────────────────────────────
type HistoryStore = ReturnType<typeof createHistoryStore>

// ── Store Factory ─────────────────────────────────────────────────────────────
/**
 * Creates a scoped history store with time-travel capabilities.
 * Uses zustand-travel middleware for automatic undo/redo management.
 *
 * Note: The store state is AnyAppData. Travel middleware tracks history automatically
 * via JSON patches. Use setState to push new states.
 */
const createHistoryStore = (initialState: AnyAppData) => {
  return createStore<AnyAppData>()(
    travel(() => initialState, {
      maxHistory: 50,
      autoArchive: true
    })
  )
}

// ── Context ───────────────────────────────────────────────────────────────────
const ProjectHistoryContext = createContext<HistoryStore | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
interface ProjectHistoryProviderProps {
  children: ReactNode
  initialState: AnyAppData
}

export function ProjectHistoryProvider({ children, initialState }: ProjectHistoryProviderProps) {
  const [store] = useState(() => createHistoryStore(initialState))

  return (
    <ProjectHistoryContext.Provider value={store}>
      {children}
    </ProjectHistoryContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * Direct access to the scoped travel store.
 * Each ProjectHistoryProvider instance has its own isolated history state.
 *
 * @example
 * const { state, setState, controls } = useProjectHistory()
 * controls.back()   // undo
 * controls.forward() // redo
 */
export function useProjectHistory() {
  const store = useContext(ProjectHistoryContext)
  if (store === null) {
    throw new Error('useProjectHistory must be used within a ProjectHistoryProvider')
  }

  // Subscribe to store changes - triggers re-renders when state changes
  const state = useStore(store, (s) => s)

  // Get travel controls
  const controls = store.getControls()

  return {
    state,
    setState: store.setState,
    controls
  }
}

// ── Hook with debounced push ──────────────────────────────────────────────────
interface UseProjectHistoryWithDebounceOptions {
  /** Debounce delay in ms (default: 500ms) */
  debounceMs?: number
}

/**
 * useProjectHistory with debounced state pushes.
 * Useful for rapid edits (e.g., typing) where you don't want every keystroke in history.
 *
 * @example
 * const { state, push } = useProjectHistoryWithDebounce({ debounceMs: 500 })
 * push(newData) // Will be debounced
 */
export function useProjectHistoryWithDebounce(options: UseProjectHistoryWithDebounceOptions = {}) {
  const { debounceMs = 500 } = options
  const { state, setState, controls } = useProjectHistory()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<AnyAppData | null>(null)

  const push = useCallback((newState: AnyAppData) => {
    pendingRef.current = newState

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      const pending = pendingRef.current
      if (pending) {
        setState(() => pending)
        pendingRef.current = null
      }
    }, debounceMs)
  }, [setState, debounceMs])

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return {
    state,
    push,
    setState,
    controls
  }
}

// ── Hook for getting history states (for save/export) ─────────────────────────
/**
 * Get current state and full history array.
 * Useful for saving project state including undo/redo stack.
 */
export function useProjectHistorySnapshot() {
  const store = useContext(ProjectHistoryContext)
  if (store === null) {
    throw new Error('useProjectHistorySnapshot must be used within a ProjectHistoryProvider')
  }

  const controls = store.getControls()
  const fullHistory = controls.getHistory() as unknown as AnyAppData[]
  const position = controls.position

  return {
    currentState: fullHistory[position] as AnyAppData,
    past: fullHistory.slice(0, position) as AnyAppData[],
    future: fullHistory.slice(position + 1) as AnyAppData[],
    position,
    canUndo: controls.canBack(),
    canRedo: controls.canForward()
  }
}
