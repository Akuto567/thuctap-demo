export type Stage = {
  id: string
  location: string
  story: string
  prompt: string
  options: string[]
  correctAnswer: number
  explanation: string
  points: number
}

export type StageResult = {
  stageId: string
  isCorrect: boolean
  pointsEarned: number
  selectedOption: number
}

export type MascotMood =
  | 'ready'
  | 'cheering'
  | 'thinking'
  | 'celebrating'
  | 'tired'
