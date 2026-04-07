import CollectionsIcon from '@mui/icons-material/Collections'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Typography } from '@mui/material'
import React, { useState } from 'react'
import { SidebarTab } from '../../components/editors'
import { WhackAMoleAppData } from '../../types'
import { QuestionsTab, SettingsTab } from './components'
import { useWhackAMoleCrud } from './hooks/useWhackAMoleCrud'

interface Props {
  appData: WhackAMoleAppData
  projectDir: string
  onChange: (data: WhackAMoleAppData) => void
}

type Tab = 'questions' | 'settings'

function normalize(d: WhackAMoleAppData): WhackAMoleAppData {
  return {
    ...d,
    title: d.title ?? '',
    grade: d.grade ?? '',
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
  const [tab, setTab] = useState<Tab>('questions')
  const { questions } = data
  const { addQuestion, addQuestionFromDrop, updateQuestion, deleteQuestion } = useWhackAMoleCrud(
    data,
    projectDir,
    onChange
  )

  const unnamedQ = questions.filter((q) => !q.question.trim())

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
          Sections
        </Typography>
        <SidebarTab
          active={tab === 'questions'}
          onClick={() => setTab('questions')}
          icon={<CollectionsIcon fontSize="small" />}
          label="Questions"
          badge={questions.length}
          badgeColor={unnamedQ.length > 0 ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'settings'}
          onClick={() => setTab('settings')}
          icon={<SettingsIcon fontSize="small" />}
          label="Settings"
          badge={0}
          badgeColor="default"
        />
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {tab === 'questions' && (
          <QuestionsTab
            questions={questions}
            projectDir={projectDir}
            onAddQuestion={addQuestion}
            onAddQuestionFromDrop={addQuestionFromDrop}
            onUpdateQuestion={updateQuestion}
            onDeleteQuestion={deleteQuestion}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab data={data} projectDir={projectDir} onChange={onChange} />
        )}
      </Box>
    </Box>
  )
}
