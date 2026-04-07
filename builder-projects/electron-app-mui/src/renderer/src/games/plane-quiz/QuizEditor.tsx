import { Box } from '@mui/material'
import React from 'react'
import { QuizAppData } from '../../types'
import { QuizTab, SummarySidebar } from './components'
import { usePlaneQuizCrud } from './hooks/usePlaneQuizCrud'

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
  const {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion,
    addAnswer,
    updateAnswer,
    deleteAnswer
  } = usePlaneQuizCrud(data, projectDir, onChange)

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <SummarySidebar questions={questions} />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <QuizTab
          questions={questions}
          projectDir={projectDir}
          onAddQuestion={addQuestion}
          onAddQuestionFromDrop={addQuestionFromDrop}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onAddAnswer={addAnswer}
          onUpdateAnswer={updateAnswer}
          onDeleteAnswer={deleteAnswer}
        />
      </Box>
    </Box>
  )
}
