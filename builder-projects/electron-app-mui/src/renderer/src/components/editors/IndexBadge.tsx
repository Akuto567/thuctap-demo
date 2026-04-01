import { Typography } from '@mui/material'
import React from 'react'

export interface IndexBadgeProps {
  index: number
  color: 'primary' | 'secondary' | 'warning'
}

/**
 * Circular badge showing an index number (1-based).
 */
export function IndexBadge({ index, color }: IndexBadgeProps): React.ReactElement {
  const bg =
    color === 'primary'
      ? 'rgba(110,231,183,0.12)'
      : color === 'secondary'
        ? 'rgba(167,139,250,0.12)'
        : 'rgba(251,191,36,0.12)'
  const fg =
    color === 'primary' ? 'primary.main' : color === 'secondary' ? 'secondary.main' : 'warning.main'
  return (
    <Typography
      sx={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.72rem',
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {index + 1}
    </Typography>
  )
}
