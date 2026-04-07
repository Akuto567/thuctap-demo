/**
 * Hook for Find The Treasure entity CRUD operations.
 * Manages stages and answers (nested within stages) with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback, useState } from 'react'
import {
  FindTheTreasureAnswer,
  FindTheTreasureAppData,
  FindTheTreasureStage
} from '@renderer/types'

interface UseFindTheTreasureCrudReturn {
  stages: FindTheTreasureStage[]
  activeStageId: string | null
  setActiveStageId: (id: string | null) => void
  addStage: () => void
  addStageFromDrop: (filePath: string) => Promise<void>
  updateStage: (id: string, patch: Partial<FindTheTreasureStage>) => void
  deleteStage: (id: string) => void
  addAnswer: (stageId: string) => void
  updateAnswer: (stageId: string, answerId: string, patch: Partial<FindTheTreasureAnswer>) => void
  deleteAnswer: (stageId: string, answerId: string) => void
}

/**
 * Provides CRUD operations for find the treasure stages and answers.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function useFindTheTreasureCrud(
  data: FindTheTreasureAppData,
  _projectDir: string,
  onChange: (data: FindTheTreasureAppData) => void
): UseFindTheTreasureCrudReturn {
  const { resolved } = useSettings()
  const { stages } = data
  const [activeStageId, setActiveStageId] = useState<string | null>(null)

  // ── Stage CRUD ──────────────────────────────────────────────────────────
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
      name: `Stage ${sc}`,
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

  // ── Answer CRUD (nested within stages) ──────────────────────────────────
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addStage
  })

  return {
    stages,
    activeStageId,
    setActiveStageId,
    addStage,
    addStageFromDrop,
    updateStage,
    deleteStage,
    addAnswer,
    updateAnswer,
    deleteAnswer
  }
}
