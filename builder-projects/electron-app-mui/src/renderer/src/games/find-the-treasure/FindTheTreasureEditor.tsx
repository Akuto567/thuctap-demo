import { Box, Typography } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import React, { useCallback, useState } from 'react'
import { FindTheTreasureAnswer, FindTheTreasureAppData, FindTheTreasureStage } from '../../types'
import type { Tab } from './components'
import { StageSidebar, StagesTab } from './components'

interface Props {
  appData: FindTheTreasureAppData
  projectDir: string
  onChange: (data: FindTheTreasureAppData) => void
}

function normalize(d: FindTheTreasureAppData): FindTheTreasureAppData {
  return {
    ...d,
    _stageCounter: d._stageCounter ?? 0,
    _answerCounter: d._answerCounter ?? 0,
    stages: d.stages ?? []
  }
}

export default function FindTheTreasureEditor({
  appData: raw,
  projectDir: _projectDir,
  onChange
}: Props): React.ReactElement {
  const data = normalize(raw)
  const [tab, setTab] = useState<Tab>('stages')
  const [activeStageId, setActiveStageId] = useState<string | null>(null)
  const { resolved } = useSettings()
  const { stages } = data

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addStage = useCallback(() => {
    const sc = data._stageCounter + 1
    const sid = `stage-${sc}`
    const ac = data._answerCounter

    const answers: FindTheTreasureAnswer[] = [
      {
        id: `${sid}-a-${ac + 1}`,
        text: resolved.prefillNames ? `Option ${ac + 1}` : '',
        isCorrect: true
      },
      {
        id: `${sid}-a-${ac + 2}`,
        text: resolved.prefillNames ? `Option ${ac + 2}` : '',
        isCorrect: false
      }
    ]

    const stage: FindTheTreasureStage = {
      id: sid,
      stageName: resolved.prefillNames ? `Location ${sc}` : '',
      stageText: resolved.prefillNames ? `Story ${sc}` : '',
      question: resolved.prefillNames ? `Prompt ${sc}` : '',
      answers,
      stageDescription: resolved.prefillNames ? `Explanation ${sc}` : '',
      stageValue: 1
    }

    onChange({
      ...data,
      _stageCounter: sc,
      _answerCounter: ac + 2,
      stages: [...stages, stage]
    })

    // Auto-select the new stage
    setActiveStageId(sid)
  }, [data, stages, resolved.prefillNames, onChange])

  const addStageFromDrop = useCallback(
    async (_filePath: string) => {
      // find-the-treasure doesn't use images, so just add a stage
      addStage()
    },
    [addStage]
  )

  const updateStage = useCallback(
    (id: string, patch: Partial<FindTheTreasureStage>) => {
      onChange({
        ...data,
        stages: stages.map((s) => (s.id === id ? { ...s, ...patch } : s))
      })
    },
    [data, stages, onChange]
  )

  const deleteStage = useCallback(
    (id: string) => {
      const idx = stages.findIndex((s) => s.id === id)
      const newStages = stages.filter((s) => s.id !== id)
      onChange({ ...data, stages: newStages })

      // Select adjacent stage after deletion
      if (activeStageId === id) {
        if (newStages.length === 0) {
          setActiveStageId(null)
        } else {
          const newIdx = Math.min(idx, newStages.length - 1)
          setActiveStageId(newStages[Math.max(0, newIdx)].id)
        }
      }
    },
    [data, stages, activeStageId, onChange]
  )

  const addAnswer = useCallback(
    (stageId: string) => {
      onChange({
        ...data,
        stages: stages.map((s) => {
          if (s.id !== stageId) return s
          const ac = data._answerCounter + 1
          const newAnswer: FindTheTreasureAnswer = {
            id: `${stageId}-a-${ac}`,
            text: resolved.prefillNames ? `Option ${ac}` : '',
            isCorrect: false
          }
          return { ...s, answers: [...s.answers, newAnswer] }
        }),
        _answerCounter: data._answerCounter + 1
      })
    },
    [data, stages, resolved.prefillNames, onChange]
  )

  const updateAnswer = useCallback(
    (stageId: string, answerId: string, patch: Partial<FindTheTreasureAnswer>) => {
      onChange({
        ...data,
        stages: stages.map((s) => {
          if (s.id !== stageId) return s
          let answers = s.answers.map((a) => (a.id === answerId ? { ...a, ...patch } : a))

          // Marking as correct → uncheck others (single-correct mode)
          if (patch.isCorrect) {
            answers = answers.map((a) =>
              a.id === answerId ? { ...a, isCorrect: true } : { ...a, isCorrect: false }
            )
          }

          return { ...s, answers }
        })
      })
    },
    [data, stages, onChange]
  )

  const deleteAnswer = useCallback(
    (stageId: string, answerId: string) => {
      onChange({
        ...data,
        stages: stages.map((s) =>
          s.id !== stageId ? s : { ...s, answers: s.answers.filter((a) => a.id !== answerId) }
        )
      })
    },
    [data, stages, onChange]
  )

  // ── Stage selection ───────────────────────────────────────────────────────
  const handleStageSelect = useCallback((stageId: string) => {
    setActiveStageId(stageId)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addStage
  })

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <StageSidebar
        tab={tab}
        onTabChange={setTab}
        stages={stages}
        activeStageId={activeStageId}
        onStageSelect={handleStageSelect}
        onStageDelete={deleteStage}
      />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {tab === 'stages' && (
          <StagesTab
            stages={stages}
            selectedStageId={activeStageId}
            onAddStage={addStage}
            onAddStageFromDrop={addStageFromDrop}
            onUpdateStage={updateStage}
            onDeleteStage={deleteStage}
            onAddAnswer={addAnswer}
            onUpdateAnswer={updateAnswer}
            onDeleteAnswer={deleteAnswer}
            onSelectStage={handleStageSelect}
          />
        )}
        {tab === 'settings' && (
          <Box>
            <Typography variant="h6" sx={{ color: 'common.white', mb: 2 }}>
              Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No settings available for this game yet.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
