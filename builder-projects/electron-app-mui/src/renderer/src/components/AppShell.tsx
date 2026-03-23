import React, { useEffect } from 'react'
import { Box } from '@mui/material'

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Remove splash screen after first React paint
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('hiding')
    const t = setTimeout(() => splash.remove(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#0f1117'
      }}
    >
      {/* macOS hiddenInset drag region */}
      <Box
        sx={{ height: '28px', flexShrink: 0, WebkitAppRegion: 'drag', background: 'transparent' }}
      />
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  )
}
