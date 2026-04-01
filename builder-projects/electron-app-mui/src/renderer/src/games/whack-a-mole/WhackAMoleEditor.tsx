import AddIcon from '@mui/icons-material/Add'
import MoleIcon from '@mui/icons-material/Cookie'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Typography
} from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import React, { useCallback } from 'react'
import {
  EmptyState,
  FileDropTarget,
  IndexBadge,
  NameField,
  SidebarTab,
  StickyHeader
} from '../../components/EditorShared'
import ImagePicker from '../../components/ImagePicker'
import { WhackAMoleAppData, WhackAMoleQuestion } from '../../types'

interface Props {
  appData: WhackAMoleAppData
  projectDir: string
  onChange: (data: WhackAMoleAppData) => void
}

function normalize(d: WhackAMoleAppData): WhackAMoleAppData {
  return {
    ...d,
    _questionCounter: d._questionCounter ?? 0,
    questions: d.questions ?? []
  }
}

export default function WhackAMoleEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.ReactElement {
  const data = normalize(raw)
  const { resolved } = useSettings()
  const { questions } = data

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addQuestion = useCallback(
    (initialImage?: string) => {
      const qc = data._questionCounter + 1
      const qid = `q-${qc}`
      const q: WhackAMoleQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        questionImage: initialImage ?? null,
        answerText: resolved.prefillNames ? `Answer ${qc}` : '',
        answerImage: null
      }
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const addQuestionFromDrop = useCallback(
    async (filePath: string) => {
      const qc = data._questionCounter + 1
      const qid = `q-${qc}`
      const questionImage = await window.electronAPI.importImage(filePath, projectDir, qid)
      const q: WhackAMoleQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        questionImage,
        answerText: resolved.prefillNames ? `Answer ${qc}` : '',
        answerImage: null
      }
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, projectDir, resolved.prefillNames, onChange]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<WhackAMoleQuestion>) => {
      onChange({ ...data, questions: questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
    },
    [data, questions, onChange]
  )

  const deleteQuestion = useCallback(
    (id: string) => {
      onChange({ ...data, questions: questions.filter((q) => q.id !== id) })
    },
    [data, questions, onChange]
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addQuestion
  })

  // ── Validation ────────────────────────────────────────────────────────────
  const noQuestion = questions.filter((q) => !q.question.trim())
  const noAnswer = questions.filter((q) => !q.answerText.trim())
  const hasIssues = noQuestion.length > 0 || noAnswer.length > 0

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
          Questions
        </Typography>
        <SidebarTab
          active={true}
          onClick={() => {}}
          icon={<MoleIcon fontSize="small" />}
          label="All Questions"
          badge={questions.length}
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
          <SummaryRow label="Total questions" value={questions.length} />
          <SummaryRow
            label="With question image"
            value={questions.filter((q) => q.questionImage !== null).length}
          />
          <SummaryRow
            label="With answer image"
            value={questions.filter((q) => q.answerImage !== null).length}
          />
          {noQuestion.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
              <Typography variant="caption" color="warning.main">
                {noQuestion.length} missing question text
              </Typography>
            </Box>
          )}
          {noAnswer.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
              <Typography variant="caption" color="warning.main">
                {noAnswer.length} missing answer text
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {[
              noQuestion.length > 0 && `${noQuestion.length} question(s) have no text`,
              noAnswer.length > 0 && `${noAnswer.length} question(s) have no answer text`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        <StickyHeader
          title="Questions"
          description="Each question has a correct answer. All answers will be pooled in the game."
          actions={
            <FileDropTarget onFileDrop={addQuestionFromDrop}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={() => addQuestion()}
              >
                Add Question
              </Button>
            </FileDropTarget>
          }
        />

        {questions.length === 0 ? (
          <EmptyState
            icon={<MoleIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
            title="No questions yet"
            description='Click "Add Question" or drop an image to create your first question.'
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                projectDir={projectDir}
                autoFocus={idx === questions.length - 1}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }): React.ReactElement {
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

function QuestionCard({
  question,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete
}: {
  question: WhackAMoleQuestion
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, p: Partial<WhackAMoleQuestion>) => void
  onDelete: (id: string) => void
}): React.ReactElement {
  // Shared subgrid style for the drop target wrappers
  const subgridStyle = {
    gridColumn: '1 / -1', // Spans all 4 columns of the Paper
    display: 'grid',
    gridTemplateColumns: 'subgrid', // Inherits tracks from Paper
    alignItems: 'start',
    gap: 2,
    p: 2
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 2,
        background: '#1a1d27',
        overflow: 'hidden',
        // ── MASTER GRID DEFINITION ──
        display: 'grid',
        gridTemplateColumns: 'min-content min-content 1fr min-content',
        alignItems: 'start'
      }}
    >
      {/* ── ROW 1: QUESTION ────────────────────────────────────────── */}
      <FileDropTarget
        onFileDrop={async (fp) => {
          const rel = await window.electronAPI.importImage(fp, projectDir, question.id)
          onUpdate(question.id, { questionImage: rel })
        }}
        sx={[
          subgridStyle,
          {
            // Top row: only round the top corners to match the Paper
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit'
          }
        ]}
      >
        {/* Col 1 */}
        <Box sx={{ mt: 0.5 }}>
          <IndexBadge index={index} color="primary" />
        </Box>

        {/* Col 2 */}
        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={`${question.id}-question`}
          value={question.questionImage}
          onChange={(p) => onUpdate(question.id, { questionImage: p })}
          label="Question"
          size={80}
        />

        {/* Col 3 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <NameField
            label="Question text"
            value={question.question}
            onChange={(v) => onUpdate(question.id, { question: v })}
            placeholder="e.g. Con chuột đang ở vị trí nào?"
            autoFocus={autoFocus}
            multiline
          />
          <Typography variant="caption" color="text.secondary">
            This question will be displayed to students.
          </Typography>
        </Box>

        {/* Col 4 */}
        <IconButton
          size="small"
          onClick={() => onDelete(question.id)}
          sx={{
            color: 'error.main',
            opacity: 0.6,
            '&:hover': { opacity: 1 },
            mt: 1,
            justifySelf: 'center'
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </FileDropTarget>

      {/* ── ROW 2: ANSWER ───────────────────────────────────────────── */}
      <FileDropTarget
        onFileDrop={async (fp) => {
          const rel = await window.electronAPI.importImage(fp, projectDir, `${question.id}-answer`)
          onUpdate(question.id, { answerImage: rel })
        }}
        sx={[
          subgridStyle,
          {
            // Bottom row: only round the bottom corners
            borderBottomLeftRadius: 'inherit',
            borderBottomRightRadius: 'inherit'
          }
        ]}
      >
        {/* ROW 1 of this subgrid: The Heading */}
        <Typography
          variant="overline"
          sx={{
            gridColumn: '1 / 4', // Spans from Badge to Input
            color: '#6ee7b7',
            fontWeight: 700,
            letterSpacing: 1.2,
            fontSize: '0.65rem',
            lineHeight: 1,
            mb: 0.5,
            pl: 1
          }}
        >
          Correct Answer (The mole students should whack)
        </Typography>

        {/* Fill the 4th column slot in the heading row */}
        <Box />

        {/* ROW 2 of this subgrid: The Content */}
        {/* Col 1: Empty (stays aligned with Badge width) */}
        <Box />

        {/* Col 2 */}
        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={`${question.id}-answer`}
          value={question.answerImage}
          onChange={(p) => onUpdate(question.id, { answerImage: p })}
          label="Answer"
          size={80}
        />

        {/* Col 3 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <NameField
            label="Answer text"
            value={question.answerText}
            onChange={(v) => onUpdate(question.id, { answerText: v })}
            placeholder="e.g. Dưới đất"
            multiline={false}
          />
          <Typography variant="caption" color="text.secondary">
            In the game, this mole will appear among other decoy moles.
          </Typography>
        </Box>

        {/* Col 4: Empty (prevents input from stretching into Trash icon area) */}
        <Box />
      </FileDropTarget>
    </Paper>
  )
}
