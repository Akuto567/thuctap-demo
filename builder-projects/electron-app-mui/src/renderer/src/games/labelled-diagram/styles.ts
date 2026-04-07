import { keyframes, styled, Box } from '@mui/material'

export const BADGE_COLORS = [
  '#f44336', // Red
  '#4caf50', // Green
  '#2196f3', // Blue
  '#ffeb3b', // Yellow
  '#9c27b0', // Purple
  '#ff9800', // Orange
  '#00bcd4', // Cyan
  '#e91e63', // Pink
  '#795548', // Brown
  '#607d8b' // Blue Grey
]

export const pulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`

export const hoverBadgePulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
`

export const SelectedBadgeOutline = styled(Box)(() => ({
  position: 'absolute',
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: '2px solid white',
  animation: `${pulse} 1.5s infinite`,
  pointerEvents: 'none',
  zIndex: 9
}))

export const getBadgeColor = (index: number): string => {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}

export const gridBackground = {
  backgroundColor: '#11141c',
  backgroundImage: `
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
  `,
  backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
}

export const DIAGRAM_PADDING = 50
