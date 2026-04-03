import { SettingsContext, SettingsContextValue } from '@renderer/context/SettingsContext'
import { useContext } from 'react'

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
