import { Box, Chip, SxProps, TextField } from '@mui/material'
import { useCallback, useRef } from 'react'

export interface AtoZWordFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  sx?: SxProps
}

/**
 * A specialized text field that:
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
}: AtoZWordFieldProps): React.ReactElement {
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
