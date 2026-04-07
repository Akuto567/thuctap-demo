/**
 * Hook for Plane Quiz entity CRUD operations.
 * Manages questions and answers (nested within questions) with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { toBb26 } from '@renderer/utils'
import { useCallback } from 'react'
import { QuizAnswer, QuizAppData, QuizQuestion } from '@renderer/types'

interface UsePlaneQuizCrudReturn {
  questions: QuizQuestion[]
  addQuestion: (initialImage?: string) => void
  addQuestionFromDrop: (filePath: string) => Promise<void>
  updateQuestion: (id: string, patch: Partial<QuizQuestion>) => void
  deleteQuestion: (id: string) => void
  addAnswer: (qid: string) => void
  updateAnswer: (qid: string, aid: string, patch: Partial<QuizAnswer>) => void
  deleteAnswer: (qid: string, aid: string) => void
}

/**
 * Provides CRUD operations for plane quiz questions and answers.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function usePlaneQuizCrud(
  data: QuizAppData,
  projectDir: string,
  onChange: (data: QuizAppData) => void
): UsePlaneQuizCrudReturn {
  const { resolved } = useSettings()
  const { questions } = data

  // ── Question CRUD ─────────────────────────────────────────────────────────
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

  // ── Answer CRUD (nested within questions) ─────────────────────────────────
  const addAnswer = useCallback(
    (qid: string) => {
      onChange({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          const ac = q._answerCounter + 1
          const newAnswer: QuizAnswer = {
            id: `${qid}-a-${ac}`,
            text: resolved.prefillNames ? `Answer ${toBb26(ac)}` : '',
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  // Quiz has only one unit (question), so all tiers do the same
  useEntityCreateShortcut({
    onTier1: addQuestion
  })

  return {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion,
    addAnswer,
    updateAnswer,
    deleteAnswer
  }
}
