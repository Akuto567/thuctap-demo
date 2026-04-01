/**
 * Shared primitives used by both GroupSortEditor and QuizEditor.
 * Keep this file free of game-specific logic.
 */
import { Badge, Box, Chip, SxProps, TextField, Typography } from '@mui/material'
import { JSX, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

// ── SidebarTab ────────────────────────────────────────────────────────────────
export function SidebarTab({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeColor
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge: number
  badgeColor: 'default' | 'error' | 'primary'
}): JSX.Element {
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
            position: 'static', // Removes the "floating" absolute position
            transform: 'none' // Prevents the offset shift
          }
        }}
        max={99}
      >
        <span />
      </Badge>
    </Box>
  )
}

// ── IndexBadge ────────────────────────────────────────────────────────────────
export function IndexBadge({
  index,
  color
}: {
  index: number
  color: 'primary' | 'secondary' | 'warning'
}): JSX.Element {
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

// ── NameField ─────────────────────────────────────────────────────────────────
/**
 * Text field that auto-focuses and selects-all when autoFocus=true (newest card).
 * Lets users immediately type over the prefilled name.
 */
export function NameField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  multiline,
  sx
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  multiline?: boolean
  sx?: SxProps
}): JSX.Element {
  const didSelect = useRef(false)
  const handleRef = useCallback(
    (input: HTMLInputElement | null) => {
      if (input && autoFocus && !didSelect.current) {
        didSelect.current = true
        setTimeout(() => {
          input.focus()
          input.select()
        }, 30)
      }
    },
    [autoFocus]
  )

  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      sx={[{ flex: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}
      error={!value.trim()}
      helperText={!value.trim() ? 'Required' : ''}
      inputRef={handleRef}
    />
  )
}

// ── AtoZWordField ─────────────────────────────────────────────────────────────
/**
 * A specialized version of NameField that:
 * 1. Forces all input to uppercase
 * 2. Restricts content to A-Z letters (shows warning if invalid)
 * 3. Shows a "letter bubble" preview of the word
 */
export function AtoZWordField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  sx
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  sx?: SxProps
}): JSX.Element {
  const wordText = value.trim().toUpperCase()
  const isInvalid = wordText && !/^[A-Z]+$/.test(wordText)

  const didSelect = useRef(false)
  const handleRef = useCallback(
    (input: HTMLInputElement | null) => {
      if (input && autoFocus && !didSelect.current) {
        didSelect.current = true
        setTimeout(() => {
          input.focus()
          input.select()
        }, 30)
      }
    },
    [autoFocus]
  )

  return (
    <Box
      sx={[
        {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          flex: 1
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        size="small"
        error={!!isInvalid || !value.trim()}
        helperText={!value.trim() ? 'Required' : isInvalid ? 'Only A–Z letters allowed' : ''}
        inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 4, fontWeight: 700 } }}
        inputRef={handleRef}
        sx={{ width: 220 }}
      />

      {/* Letter bubble preview */}
      {wordText && !isInvalid && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', pt: 0.5 }}>
          {wordText.split('').map((ch, i) => (
            <Box
              key={i}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(110,231,183,0.15)',
                border: '1px solid rgba(110,231,183,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'primary.main',
                fontFamily: 'monospace'
              }}
            >
              {ch}
            </Box>
          ))}
          <Chip
            label={`${wordText.length} letter${wordText.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ height: 20, fontSize: '0.6rem', ml: 0.5, alignSelf: 'center' }}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 1.5,
        color: 'text.disabled',
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 3
      }}
    >
      {icon}
      <Typography variant="h6" sx={{ opacity: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.4, textAlign: 'center', maxWidth: 320 }}>
        {description}
      </Typography>
    </Box>
  )
}

// ── FileDropTarget ────────────────────────────────────────────────────────────
/**
 * Wraps any children with react-dropzone for image files.
 * Highlights when an image is dragged over. Calls onFileDrop with the
 * native file path.
 */
export function FileDropTarget({
  onFileDrop,
  children,
  sx,
  disabled
}: {
  onFileDrop: (filePath: string) => void
  children: React.ReactNode
  sx?: SxProps
  disabled?: boolean
}): JSX.Element {
  const { getRootProps, isDragActive } = useDropzone({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDrop: (acceptedFiles: any[], _rejections, event: any) => {
      // Prevent bubbling to parents (e.g. from item card to group card)
      event?.stopPropagation()
      const file = acceptedFiles.find((f) => f.type?.startsWith('image/'))
      if (file) {
        onFileDrop(window.electronAPI.getPathForFile(file))
      }
    },
    onDragEnter: (e) => e.stopPropagation(),
    onDragOver: (e) => e.stopPropagation(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFilesFromEvent: (event: any): any => {
      const files = event.dataTransfer?.files
      return files ? Array.from(files) : []
    },
    noClick: true, // Let children handle clicks (e.g. Buttons)
    disabled,
    accept: { 'image/*': [] }
  })

  return (
    <Box
      {...getRootProps()}
      sx={[
        {
          transition: 'outline 0.1s, background 0.1s',
          outline: isDragActive ? '2px solid #6ee7b7' : '2px solid transparent',
          // Draw the outline INSIDE the box so it isn't clipped
          outlineOffset: -2,
          background: isDragActive ? 'rgba(110,231,183,0.05)' : 'transparent'
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {children}
    </Box>
  )
}

// ── StickyHeader ──────────────────────────────────────────────────────────────
/**
 * A sticky bar pinned to the top of the scrollable content area.
 * Renders a title + description on the left, and action controls on the right.
 */
export function StickyHeader({
  title,
  description,
  actions
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}): JSX.Element {
  return (
    <Box
      sx={{
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
        // Dark semi-transparent background matching your theme
        background: 'rgba(15, 18, 25, 0.88)',
        // Stronger blur for better contrast
        backdropFilter: 'blur(20px) saturate(180%)',
        // Subtle border to match your UI elements
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        // Optional: slight shadow for depth
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)'
      }}
    >
      <Box>
        <Typography
          variant="h6"
          sx={{
            lineHeight: 1.2,
            color: 'common.white', // Ensure title has good contrast
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)', // Slightly faded for hierarchy
              display: 'block',
              mt: 0.25
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  )
}
