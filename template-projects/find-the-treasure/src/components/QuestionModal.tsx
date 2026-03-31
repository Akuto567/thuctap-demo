import type { Dispatch, SetStateAction } from 'react'
import type { Stage, StageResult } from '../types'

type QuestionModalProps = {
  stage: Stage
  selectedOption: number | null
  setSelectedOption: Dispatch<SetStateAction<number | null>>
  onConfirm: () => void
  onNext: () => void
  onClose: () => void
  answerLocked: boolean
  latestResult?: StageResult
}

export function QuestionModal({
  stage,
  selectedOption,
  setSelectedOption,
  onConfirm,
  onNext,
  onClose,
  answerLocked,
  latestResult,
}: QuestionModalProps) {
  return (
    <div className="modal-backdrop">
      <section className="question-card question-window" role="dialog" aria-modal="true">
        <div className="question-header">
          <div>
            <p className="section-label">Island challenge</p>
            <h2>{stage.location}</h2>
          </div>
          <div className="question-window-actions">
            <span className="point-chip">{stage.points} points</span>
            <button
              className="close-button"
              type="button"
              onClick={onClose}
              disabled={answerLocked}
              aria-label="Close question window"
            >
              x
            </button>
          </div>
        </div>

        <p className="question-story">{stage.prompt}</p>

        <div className="options-list">
          {stage.options.map((option, index) => {
            const isSelected = selectedOption === index
            const isCorrect = answerLocked && stage.correctAnswer === index
            const isWrong = answerLocked && isSelected && !isCorrect

            return (
              <button
                key={option}
                type="button"
                className={[
                  'option-button',
                  isSelected ? 'selected' : '',
                  isCorrect ? 'correct' : '',
                  isWrong ? 'wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => !answerLocked && setSelectedOption(index)}
                disabled={answerLocked}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {option}
              </button>
            )
          })}
        </div>

        {answerLocked && latestResult ? (
          <div
            className={`answer-feedback ${
              latestResult.isCorrect ? 'success' : 'warning'
            }`}
          >
            <strong>
              {latestResult.isCorrect
                ? 'Correct! The mascot moves ahead.'
                : 'Not quite, but the journey continues.'}
            </strong>
            <p>{stage.explanation}</p>
          </div>
        ) : (
          <p className="hint-text">{stage.story}</p>
        )}

        <div className="question-actions">
          {!answerLocked ? (
            <button
              className="primary-button"
              type="button"
              onClick={onConfirm}
              disabled={selectedOption === null}
            >
              Check answer
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={onNext}>
              Continue journey
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
