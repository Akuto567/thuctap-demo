/**
 * Hook for Whack-A-Mole entity CRUD operations.
 * Manages question creation, updates, and deletion with counter-based ID generation.
 */

import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback } from 'react'
import { WhackAMoleAppData, WhackAMoleQuestion } from '@renderer/types'

interface UseWhackAMoleCrudReturn {
  questions: WhackAMoleQuestion[]
  addQuestion: (initialImage?: string) => void
  addQuestionFromDrop: (filePath: string) => Promise<void>
  updateQuestion: (id: string, patch: Partial<WhackAMoleQuestion>) => void
  deleteQuestion: (id: string) => void
}

/**
 * Provides CRUD operations for whack-a-mole questions.
 *
 * @param data - Normalized appData
 * @param projectDir - Project directory path for image imports
 * @param onChange - State update callback
 */
export function useWhackAMoleCrud(
  data: WhackAMoleAppData,
  projectDir: string,
  onChange: (data: WhackAMoleAppData) => void
): UseWhackAMoleCrudReturn {
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

  return {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion
  }
}
