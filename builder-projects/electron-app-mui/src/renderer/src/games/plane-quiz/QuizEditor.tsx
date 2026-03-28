import AddIcon from '@mui/icons-material/Add'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import QuizIcon from '@mui/icons-material/Quiz'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
    Alert,
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { useEditorShortcuts } from '@renderer/hooks/useEditorShortcuts'
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
import { useSettings } from '../../context/SettingsContext'
import { QuizAnswer, QuizAppData, QuizQuestion } from '../../types'

interface Props {
  appData: QuizAppData
  projectDir: string
  onChange: (data: QuizAppData) => void
}

function normalize(d: QuizAppData): QuizAppData {
  return {
    ...d,
    _questionCounter: d._questionCounter ?? 0,
    questions: (d.questions ?? []).map((q) => ({ ...q, _answerCounter: q._answerCounter ?? 0 }))
  }
}

export default function QuizEditor({
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
      const q: QuizQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        imagePath: initialImage ?? null,
        multipleCorrect: false,
        _answerCounter: 2,
        answers: [
          { id: `${qid}-a-1`, text: resolved.prefillNames ? 'Answer A' : '', isCorrect: true },
          { id: `${qid}-a-2`, text: resolved.prefillNames ? 'Answer B' : '', isCorrect: false }
        ]
      }
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const addQuestionFromDrop = useCallback(
    async (filePath: string) => {
      const qc = data._questionCounter + 1
      const qid = `q-${qc}`
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, qid)
      const q: QuizQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        imagePath,
        multipleCorrect: false,
        _answerCounter: 2,
        answers: [
          { id: `${qid}-a-1`, text: resolved.prefillNames ? 'Answer A' : '', isCorrect: true },
          { id: `${qid}-a-2`, text: resolved.prefillNames ? 'Answer B' : '', isCorrect: false }
        ]
      }
      onChange({ ...data, _questionCounter: qc, questions: [...questions, q] })
    },
    [data, questions, projectDir, resolved.prefillNames, onChange]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<QuizQuestion>) => {
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

  const addAnswer = useCallback(
    (qid: string) => {
      onChange({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          const ac = q._answerCounter + 1
          const newAnswer: QuizAnswer = {
            id: `${qid}-a-${ac}`,
            text: resolved.prefillNames ? `Answer ${String.fromCharCode(64 + ac)}` : '',
            isCorrect: false
          }
          return { ...q, _answerCounter: ac, answers: [...q.answers, newAnswer] }
        })
      })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const updateAnswer = useCallback(
    (qid: string, aid: string, patch: Partial<QuizAnswer>) => {
      onChange({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          let answers = q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a))
          if (patch.isCorrect && !q.multipleCorrect) {
            answers = answers.map((a) => (a.id === aid ? a : { ...a, isCorrect: false }))
          }
          return { ...q, answers }
        })
      })
    },
    [data, questions, onChange]
  )

  const deleteAnswer = useCallback(
    (qid: string, aid: string) => {
      onChange({
        ...data,
        questions: questions.map((q) =>
          q.id !== qid ? q : { ...q, answers: q.answers.filter((a) => a.id !== aid) }
        )
      })
    },
    [data, questions, onChange]
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // Quiz has only one unit (question), so all tiers do the same
  useEditorShortcuts(() => addQuestion())

  // ── Validation ────────────────────────────────────────────────────────────
  const noText = questions.filter((q) => !q.question.trim())
  const noCorrect = questions.filter((q) => !q.answers.some((a) => a.isCorrect))
  const emptyAnswers = questions.filter((q) => q.answers.some((a) => !a.text.trim()))
  const tooFewAns = questions.filter((q) => q.answers.length < 2)
  const hasIssues =
    noText.length > 0 || noCorrect.length > 0 || emptyAnswers.length > 0 || tooFewAns.length > 0

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
          icon={<QuizIcon fontSize="small" />}
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
            label="Single-answer"
            value={questions.filter((q) => !q.multipleCorrect).length}
          />
          <SummaryRow
            label="Multiple-answer"
            value={questions.filter((q) => q.multipleCorrect).length}
          />
          {noCorrect.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
              <Typography variant="caption" color="warning.main">
                {noCorrect.length} need a correct answer
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
              noText.length > 0 && `${noText.length} question(s) have no text`,
              noCorrect.length > 0 &&
                `${noCorrect.length} question(s) have no correct answer marked`,
              emptyAnswers.length > 0 &&
                `${emptyAnswers.length} question(s) have blank answer text`,
              tooFewAns.length > 0 && `${tooFewAns.length} question(s) need at least 2 answers`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        <StickyHeader
          title="Questions"
          description="Each question has answer choices. Mark which answers are correct."
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
            icon={<QuizIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
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
                onAddAnswer={addAnswer}
                onUpdateAnswer={updateAnswer}
                onDeleteAnswer={deleteAnswer}
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
  onDelete,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer
}: {
  question: QuizQuestion
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, p: Partial<QuizQuestion>) => void
  onDelete: (id: string) => void
  onAddAnswer: (qid: string) => void
  onUpdateAnswer: (qid: string, aid: string, p: Partial<QuizAnswer>) => void
  onDeleteAnswer: (qid: string, aid: string) => void
}): React.ReactElement {
  const hasNoCorrect = !question.answers.some((a) => a.isCorrect)
  const isSingle = !question.multipleCorrect

  return (
    <FileDropTarget
      onFileDrop={async (fp) => {
        const rel = await window.electronAPI.importImage(fp, projectDir, question.id)
        onUpdate(question.id, { imagePath: rel })
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: hasNoCorrect ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          background: '#1a1d27',
          overflow: 'hidden'
        }}
      >
        {/* Question header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <IndexBadge index={index} color="primary" />

          <ImagePicker
            projectDir={projectDir}
            desiredNamePrefix={question.id}
            value={question.imagePath}
            onChange={(p) => onUpdate(question.id, { imagePath: p })}
            label="Question image"
            size={80}
          />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <NameField
              label="Question text"
              value={question.question}
              onChange={(v) => onUpdate(question.id, { question: v })}
              placeholder="e.g. Which animal is the largest?"
              autoFocus={autoFocus}
              multiline
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={question.multipleCorrect}
                    onChange={(_, v) => onUpdate(question.id, { multipleCorrect: v })}
                  />
                }
                label={
                  <Typography variant="caption" color="text.secondary">
                    Multiple correct answers
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              {hasNoCorrect && (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                  label="No correct answer marked"
                  size="small"
                  color="warning"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </Box>

          <Tooltip title="Delete question">
            <IconButton
              size="small"
              onClick={() => onDelete(question.id)}
              sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Answers */}
        <Box sx={{ px: 2, pb: 2, pl: '88px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            variant="overline"
            sx={{ fontSize: '0.6rem', letterSpacing: 2, color: 'text.disabled' }}
          >
            Answers — click the icon to mark as correct
          </Typography>

          {question.answers.map((answer, aIdx) => {
            const isCorrect = answer.isCorrect
            const CorrectIcon = isSingle
              ? isCorrect
                ? CheckCircleIcon
                : RadioButtonUncheckedIcon
              : isCorrect
                ? CheckBoxIcon
                : CheckBoxOutlineBlankIcon

            return (
              <Box key={answer.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={isCorrect ? 'Correct answer (click to toggle)' : 'Mark as correct'}>
                  <IconButton
                    size="small"
                    onClick={() =>
                      onUpdateAnswer(question.id, answer.id, { isCorrect: !isCorrect })
                    }
                    sx={{ color: isCorrect ? 'success.main' : 'text.disabled', flexShrink: 0 }}
                  >
                    <CorrectIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <TextField
                  size="small"
                  fullWidth
                  value={answer.text}
                  onChange={(e) => onUpdateAnswer(question.id, answer.id, { text: e.target.value })}
                  placeholder={`Answer ${String.fromCharCode(64 + aIdx + 1)}…`}
                  error={!answer.text.trim()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderColor: isCorrect ? 'success.main' : undefined,
                      '& fieldset': { borderColor: isCorrect ? 'rgba(52,211,153,0.4)' : undefined }
                    }
                  }}
                />

                <Tooltip title="Remove answer">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteAnswer(question.id, answer.id)}
                      disabled={question.answers.length <= 2}
                      sx={{
                        color: 'error.main',
                        opacity: 0.5,
                        '&:hover': { opacity: 1 },
                        '&.Mui-disabled': { opacity: 0.2 }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )
          })}

          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onAddAnswer(question.id)}
            sx={{ alignSelf: 'flex-start', mt: 0.5, opacity: 0.7 }}
          >
            Add answer
          </Button>
        </Box>
      </Paper>
    </FileDropTarget>
  )
}
