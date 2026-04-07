/**
 * Hook for Jumping Frog entity CRUD operations.
 * Manages questions and answers with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback } from 'react'
import { JumpingFrogAnswer, JumpingFrogAppData, JumpingFrogQuestion } from '@renderer/types'

interface UseJumpingFrogCrudReturn {
  questions: JumpingFrogQuestion[]
  addQuestion: (initialImage?: string) => void
  addQuestionFromDrop: (filePath: string) => Promise<void>
  updateQuestion: (id: string, patch: Partial<JumpingFrogQuestion>) => void
  deleteQuestion: (id: string) => void
  updateAnswer: (questionId: string, answerId: string, patch: Partial<JumpingFrogAnswer>) => void
}

/**
 * Provides CRUD operations for jumping frog questions and answers.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function useJumpingFrogCrud(
  data: JumpingFrogAppData,
  projectDir: string,
  onChange: (data: JumpingFrogAppData) => void
): UseJumpingFrogCrudReturn {
  const { resolved } = useSettings()
  const { questions } = data

  const addQuestion = useCallback(
    (_initialImage?: string) => {
      const qc = data._questionCounter + 1
      const qid = `q-${qc}`
      const ac = data._answerCounter

      const answers: JumpingFrogAnswer[] = [
        {
          id: `${qid}-a-${ac + 1}`,
          text: resolved.prefillNames ? `Option ${ac + 1}` : '',
          imagePath: null,
          isCorrect: true
        },
        {
          id: `${qid}-a-${ac + 2}`,
          text: resolved.prefillNames ? `Option ${ac + 2}` : '',
          imagePath: null,
          isCorrect: false
        },
        {
          id: `${qid}-a-${ac + 3}`,
          text: resolved.prefillNames ? `Option ${ac + 3}` : '',
          imagePath: null,
          isCorrect: false
        }
      ]

      const q: JumpingFrogQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        answers
      }

      onChange({
        ...data,
        _questionCounter: qc,
        _answerCounter: ac + 3,
        questions: [...questions, q]
      })
    },
    [data, questions, resolved.prefillNames, onChange]
  )

  const addQuestionFromDrop = useCallback(
    async (filePath: string) => {
      const qc = data._questionCounter + 1
      const qid = `q-${qc}`
      const ac = data._answerCounter

      const relativePath = await window.electronAPI.importImage(filePath, projectDir, qid)
      const imagePath = `${relativePath.replace(/\\/g, '/')}`

      const answers: JumpingFrogAnswer[] = [
        {
          id: `${qid}-a-${ac + 1}`,
          text: resolved.prefillNames ? `Option ${ac + 1}` : '',
          imagePath,
          isCorrect: true
        },
        {
          id: `${qid}-a-${ac + 2}`,
          text: resolved.prefillNames ? `Option ${ac + 2}` : '',
          imagePath: null,
          isCorrect: false
        }
      ]

      const q: JumpingFrogQuestion = {
        id: qid,
        question: resolved.prefillNames ? `Question ${qc}` : '',
        answers
      }

      onChange({
        ...data,
        _questionCounter: qc,
        _answerCounter: ac + 2,
        questions: [...questions, q]
      })
    },
    [data, questions, projectDir, resolved.prefillNames, onChange]
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<JumpingFrogQuestion>) => {
      onChange({
        ...data,
        questions: questions.map((q) => (q.id === id ? { ...q, ...patch } : q))
      })
    },
    [data, questions, onChange]
  )

  const deleteQuestion = useCallback(
    (id: string) => {
      onChange({ ...data, questions: questions.filter((q) => q.id !== id) })
    },
    [data, questions, onChange]
  )

  const updateAnswer = useCallback(
    (qid: string, aid: string, patch: Partial<JumpingFrogAnswer>) => {
      onChange({
        ...data,
        questions: questions.map((q) => {
          if (q.id !== qid) return q
          let answers = q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a))

          // Marking as correct → uncheck others (single-correct mode)
          if (patch.isCorrect) {
            answers = answers.map((a) =>
              a.id === aid ? { ...a, isCorrect: true } : { ...a, isCorrect: false }
            )
          }

          return { ...q, answers }
        })
      })
    },
    [data, questions, onChange]
  )

  useEntityCreateShortcut({
    onTier1: addQuestion
  })

  return {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion,
    updateAnswer
  }
}
