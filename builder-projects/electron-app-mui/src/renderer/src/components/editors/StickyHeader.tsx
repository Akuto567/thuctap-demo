import { Box, SxProps, Typography } from '@mui/material'
import React from 'react'

export interface StickyHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  sx?: SxProps
}

/**
 * A sticky bar pinned to the top of the scrollable content area.
 * Renders a title + description on the left, and action controls on the right.
 */
export function StickyHeader({ title, description, actions, sx }: StickyHeaderProps): React.ReactElement {
  return (
    <Box
      sx={[
        {
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
          py: 1.5,
          px: 2,
          background: 'rgba(15, 18, 25, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)'
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <Box>
        <Typography variant="h6" sx={{ lineHeight: 1.2, color: 'common.white', fontWeight: 600 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Box>
  )
}
