import { Badge, Box, Typography } from '@mui/material'
import React from 'react'

export interface SidebarTabProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge: number
  badgeColor: 'default' | 'error' | 'primary'
}

/**
 * Navigation tab for editor sidebar with badge support.
 */
export function SidebarTab({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeColor
}: SidebarTabProps): React.ReactElement {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        cursor: 'pointer',
        background: active ? 'rgba(110,231,183,0.1)' : 'transparent',
        border: '1px solid',
        borderColor: active ? 'primary.dark' : 'transparent',
        color: active ? 'primary.main' : 'text.secondary',
        transition: 'all 0.15s',
        '&:hover': {
          background: active ? 'rgba(110,231,183,0.1)' : 'rgba(255,255,255,0.04)',
          color: active ? 'primary.main' : 'text.primary'
        }
      }}
    >
      {icon}
      <Typography variant="body2" sx={{ flex: 1, fontWeight: active ? 600 : 400 }}>
        {label}
      </Typography>
      <Badge
        badgeContent={badge}
        color={badgeColor === 'default' ? 'primary' : badgeColor}
        sx={{
          '& .MuiBadge-badge': {
            position: 'static',
            transform: 'none'
          }
        }}
        max={99}
      >
        <span />
      </Badge>
    </Box>
  )
}
