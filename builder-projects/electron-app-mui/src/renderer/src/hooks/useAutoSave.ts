import { useEffect, useRef } from 'react'
import { AnyAppData, ProjectMeta, ResolvedSettings } from '../types'

const AUTO_SAVE_DEBOUNCE_MS = 1000

export interface UseAutoSaveOptions {
  metaRef: React.MutableRefObject<ProjectMeta | null>
  appDataRef: React.MutableRefObject<AnyAppData>
  isDirtyRef: React.MutableRefObject<boolean>
  resolved: ResolvedSettings
  doSave: (meta: ProjectMeta, appData: AnyAppData) => Promise<void>
}

/**
 * Hook for managing auto-save behavior (interval and on-edit modes).
 * Extracted from ProjectPage to reduce component complexity.
 *
 * IMPORTANT: This hook ONLY handles auto-save timing.
 * - It does NOT manage history state (call setPresent separately)
 * - It does NOT manage dirty state (update isDirtyRef separately)
 *
 * The caller must update appDataRef and isDirtyRef BEFORE this hook's
 * auto-save logic runs.
 */
export function useAutoSave({
  metaRef,
  appDataRef,
  isDirtyRef,
  resolved,
  doSave
}: UseAutoSaveOptions): void {
  const onEditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Auto-save: interval mode ───────────────────────────────────────────────
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Set up new interval if mode is 'interval'
    if (resolved.autoSave.mode === 'interval') {
      intervalRef.current = setInterval(() => {
        if (isDirtyRef.current && metaRef.current) {
          doSave(metaRef.current, appDataRef.current).catch(() => {
            // Silently fail - user will see dirty indicator
          })
        }
      }, resolved.autoSave.intervalSeconds * 1000)
    }

    // Cleanup on unmount or mode change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [resolved.autoSave.mode, resolved.autoSave.intervalSeconds, doSave, metaRef, appDataRef, isDirtyRef])

  // ── Auto-save: on-edit mode ────────────────────────────────────────────────
  useEffect(() => {
    // Cleanup on unmount or mode change
    return () => {
      if (onEditTimerRef.current) {
        clearTimeout(onEditTimerRef.current)
        onEditTimerRef.current = null
      }
    }
  }, [])
}

/**
 * Handler for app data changes that integrates with auto-save.
 * Call this from your editor's onChange handler.
 *
 * @param newData - New app data from editor
 * @param setPresent - Function to update history state
 * @param options - Auto-save options from useAutoSave hook
 */
export function createAppDataChangeHandler(
  newData: AnyAppData,
  setPresent: (data: AnyAppData) => void,
  appDataRef: React.MutableRefObject<AnyAppData>,
  isDirtyRef: React.MutableRefObject<boolean>,
  metaRef: React.MutableRefObject<ProjectMeta | null>,
  doSave: (meta: ProjectMeta, appData: AnyAppData) => Promise<void>,
  autoSaveMode: 'off' | 'on-edit' | 'interval',
  onEditTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
): void {
  // Update history state
  setPresent(newData)
  
  // Update refs
  appDataRef.current = newData
  isDirtyRef.current = true

  // Auto-save on edit with debounce
  if (autoSaveMode === 'on-edit') {
    if (onEditTimerRef.current) clearTimeout(onEditTimerRef.current)
    onEditTimerRef.current = setTimeout(() => {
      if (metaRef.current) {
        doSave(metaRef.current, newData).catch(() => {
          // Silently fail - user will see dirty indicator
        })
      }
    }, AUTO_SAVE_DEBOUNCE_MS)
  }
}
