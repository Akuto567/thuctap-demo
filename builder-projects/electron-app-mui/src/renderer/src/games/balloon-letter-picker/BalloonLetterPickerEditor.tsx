import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useCallback } from 'react'
import {
  DroppableZone,
  EmptyState,
  IndexBadge,
  SidebarTab,
  StickyHeader,
  useEditorShortcuts
} from '../../components/EditorShared'
import ImagePicker from '../../components/ImagePicker'
import { useSettings } from '../../context/SettingsContext'
import { BalloonLetterPickerAppData, BalloonWord } from '../../types'

interface Props {
  appData: BalloonLetterPickerAppData
  projectDir: string
  onChange: (data: BalloonLetterPickerAppData) => void
}

function normalize(d: BalloonLetterPickerAppData): BalloonLetterPickerAppData {
  return { ...d, _wordCounter: d._wordCounter ?? 0, words: d.words ?? [] }
}

export default function BalloonLetterPickerEditor({ appData: raw, projectDir, onChange }: Props) {
  const data = normalize(raw)
  const { resolved } = useSettings()
  const { words } = data

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addWord = useCallback(
    (initialImageUrl?: string) => {
      const c = data._wordCounter + 1
      const w: BalloonWord = {
        id: `word-${c}`,
        word: resolved.prefillNames ? `WORD${c}` : '',
        imageUrl: initialImageUrl ?? '',
        hint: ''
      }
      onChange({ ...data, _wordCounter: c, words: [...words, w] })
    },
    [data, words, resolved.prefillNames, onChange]
  )

  const addWordFromDrop = useCallback(
    async (filePath: string) => {
      const c = data._wordCounter + 1
      const id = `word-${c}`
      const relativePath = await window.electronAPI.importImage(filePath, projectDir, id)
      // Convert to the ./images/... style relative path the template expects
      const imageUrl = `./${relativePath.replace(/\\/g, '/')}`
      const w: BalloonWord = {
        id,
        word: resolved.prefillNames ? `WORD${c}` : '',
        imageUrl,
        hint: ''
      }
      onChange({ ...data, _wordCounter: c, words: [...words, w] })
    },
    [data, words, projectDir, resolved.prefillNames, onChange]
  )

  const updateWord = useCallback(
    (id: string, patch: Partial<BalloonWord>) => {
      onChange({ ...data, words: words.map((w) => (w.id === id ? { ...w, ...patch } : w)) })
    },
    [data, words, onChange]
  )

  const deleteWord = useCallback(
    (id: string) => {
      onChange({ ...data, words: words.filter((w) => w.id !== id) })
    },
    [data, words, onChange]
  )

  // ── Image pick helper (for the inline ImagePicker inside each card) ────────
  // The template stores imageUrl as a relative string path (./images/words/foo.png)
  // We handle it by surfacing ImagePicker but mapping its relativePath → imageUrl field
  const handleImageChange = useCallback(
    (id: string, relativePath: string | null) => {
      const imageUrl = relativePath ? `./${relativePath.replace(/\\/g, '/')}` : ''
      updateWord(id, { imageUrl })
    },
    [updateWord]
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // Only one unit (word), all tiers do the same
  useEditorShortcuts(() => addWord())

  // ── Validation ────────────────────────────────────────────────────────────
  const missingWord = words.filter((w) => !w.word.trim())
  const invalidWord = words.filter((w) => w.word.trim() && !/^[A-Za-z]+$/.test(w.word.trim()))
  const missingHint = words.filter((w) => !w.hint.trim())
  const hasIssues = missingWord.length > 0 || invalidWord.length > 0 || missingHint.length > 0

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: '#13161f',
          p: 2,
          gap: 1
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Words
        </Typography>
        <SidebarTab
          active={true}
          onClick={() => {}}
          icon={<TextFieldsIcon fontSize="small" />}
          label="All Words"
          badge={words.length}
          badgeColor={hasIssues ? 'error' : 'default'}
        />

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <SummaryRow label="Total words" value={words.length} />
          <SummaryRow label="With images" value={words.filter((w) => !!w.imageUrl).length} />
          <SummaryRow label="With hints" value={words.filter((w) => !!w.hint.trim()).length} />
          {missingWord.length > 0 && (
            <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
              {missingWord.length} missing word text
            </Typography>
          )}
          {invalidWord.length > 0 && (
            <Typography variant="caption" color="warning.main">
              {invalidWord.length} contain non-letters
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {[
              missingWord.length > 0 && `${missingWord.length} word(s) have no text`,
              invalidWord.length > 0 &&
                `${invalidWord.length} word(s) contain non-letter characters`,
              missingHint.length > 0 && `${missingHint.length} word(s) are missing a hint`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        <StickyHeader
          title="Words"
          description="Each word will be spelled by picking letters from balloons. Add a hint to help students."
          actions={
            <DroppableZone onFileDrop={addWordFromDrop}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={() => addWord()}
              >
                Add Word
              </Button>
            </DroppableZone>
          }
        />

        {words.length === 0 ? (
          <EmptyState
            icon={<TextFieldsIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
            title="No words yet"
            description='Click "Add Word" or drop an image on the button to create your first word.'
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {words.map((w, idx) => (
              <WordCard
                key={w.id}
                word={w}
                index={idx}
                projectDir={projectDir}
                autoFocus={idx === words.length - 1}
                onUpdate={updateWord}
                onDelete={deleteWord}
                onImageChange={handleImageChange}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Chip
        label={value}
        size="small"
        sx={{ height: 16, fontSize: '0.65rem', minWidth: 24 }}
        color={value === 0 ? 'default' : 'primary'}
      />
    </Box>
  )
}

function WordCard({
  word,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete,
  onImageChange
}: {
  word: BalloonWord
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, p: Partial<BalloonWord>) => void
  onDelete: (id: string) => void
  onImageChange: (id: string, relativePath: string | null) => void
}) {
  const wordText = word.word.trim().toUpperCase()
  const isInvalid = wordText && !/^[A-Z]+$/.test(wordText)

  // Derive relative path from imageUrl for ImagePicker's value prop
  // imageUrl is like './images/words/jump.png', relativePath is 'images/words/jump.png'
  const imageRelative = word.imageUrl ? word.imageUrl.replace(/^\.\//, '') : null

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: isInvalid ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        background: '#1a1d27',
        transition: 'border-color 0.15s',
        '&:hover': {
          borderColor: isInvalid ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.12)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <IndexBadge index={index} color="primary" />

        <ImagePicker
          projectDir={projectDir}
          entityId={word.id}
          value={imageRelative}
          onChange={(p) => onImageChange(word.id, p)}
          label="Word image"
          size={80}
        />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Word + letter preview row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <TextField
              label="Word (uppercase letters only)"
              value={word.word}
              onChange={(e) => onUpdate(word.id, { word: e.target.value.toUpperCase() })}
              placeholder="e.g. JUMP"
              size="small"
              error={!!isInvalid || !word.word.trim()}
              helperText={
                !word.word.trim() ? 'Required' : isInvalid ? 'Only A–Z letters allowed' : ''
              }
              inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 4, fontWeight: 700 } }}
              inputRef={(el) => {
                if (el && autoFocus) {
                  setTimeout(() => {
                    el.focus()
                    el.select()
                  }, 30)
                }
              }}
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

          {/* Hint field */}
          <TextField
            label="Hint"
            value={word.hint}
            onChange={(e) => onUpdate(word.id, { hint: e.target.value })}
            placeholder="e.g. He pushes his body off the ground and rises into the air."
            size="small"
            multiline
            minRows={2}
            fullWidth
            error={!word.hint.trim()}
            helperText={!word.hint.trim() ? 'Required — helps students guess the word' : ''}
          />
        </Box>

        <Tooltip title="Delete word">
          <IconButton
            size="small"
            onClick={() => onDelete(word.id)}
            sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  )
}
