import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { GameBoard } from './components/GameBoard'
import { QuestionModal } from './components/QuestionModal'
import { MY_APP_DATA } from './data/questions'
import type { StageResult } from './types'

const MASCOT_TRAVEL_MS = 900
const COIN_RAIN_MS = 5000
const coinImages = [
  '/assets/images/coin1.svg',
  '/assets/images/coin2.svg',
  '/assets/images/coin3.svg',
  '/assets/images/coin4.svg',
]
const ANSWER_SOUND_PATHS = {
  correct: '/assets/sounds/correct.mp3',
  wrong: '/assets/sounds/failed.mp3',
} as const
const INTRO_STEPS = [
  'Follow the red route line and click the active island to open the next question.',
  'Choose one answer for each stage. Correct answers earn the stage points.',
  'Finish every island to unlock the treasure chest at the end of the map.',
]

type CoinDrop = {
  id: number
  image: string
  left: number
  size: number
  duration: number
  delay: number
  rotation: number
}

function createCoinDrops(count: number): CoinDrop[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    image: coinImages[Math.floor(Math.random() * coinImages.length)],
    left: Math.random() * 100,
    size: 26 + Math.random() * 26,
    duration: 1.8 + Math.random() * 1.6,
    delay: Math.random() * 4.2,
    rotation: (Math.random() - 0.5) * 160,
  }))
}

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [layoutSeed, setLayoutSeed] = useState(() => Math.floor(Math.random() * 1_000_000))
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [openedStageIndex, setOpenedStageIndex] = useState<number | null>(null)
  const [mascotTargetIndex, setMascotTargetIndex] = useState<number | null>(null)
  const [pendingStageIndex, setPendingStageIndex] = useState<number | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [stageResults, setStageResults] = useState<StageResult[]>([])
  const [isAnswerLocked, setIsAnswerLocked] = useState(false)
  const [showFinalScore, setShowFinalScore] = useState(false)
  const [isHeadingToTreasure, setIsHeadingToTreasure] = useState(false)
  const [showCoinRain, setShowCoinRain] = useState(false)
  const [coinDrops, setCoinDrops] = useState<CoinDrop[]>([])
  const correctAnswerSoundRef = useRef<HTMLAudioElement | null>(null)
  const wrongAnswerSoundRef = useRef<HTMLAudioElement | null>(null)
  const fallbackSoundContextRef = useRef<AudioContext | null>(null)

  const currentStage = MY_APP_DATA[currentStageIndex]
  const totalStages = MY_APP_DATA.length
  const totalScore = stageResults.reduce(
    (sum, result) => sum + result.pointsEarned,
    0,
  )
  const completedStages = stageResults.length
  const perfectRun = stageResults.every((result) => result.isCorrect)
  const gameFinished = completedStages === totalStages

  const latestResult = stageResults.at(-1)

  const mascotMood = useMemo(() => {
    if (!latestResult) {
      return 'ready'
    }

    if (gameFinished) {
      return totalScore >= 40 ? 'celebrating' : 'tired'
    }

    return latestResult.isCorrect ? 'cheering' : 'thinking'
  }, [gameFinished, latestResult, totalScore])

  useEffect(() => {
    if (pendingStageIndex === null) {
      return
    }

    const timer = window.setTimeout(() => {
      if (pendingStageIndex === currentStageIndex && !gameFinished) {
        setOpenedStageIndex(pendingStageIndex)
      }

      setPendingStageIndex(null)
    }, MASCOT_TRAVEL_MS)

    return () => window.clearTimeout(timer)
  }, [currentStageIndex, gameFinished, pendingStageIndex])

  useEffect(() => {
    if (!isHeadingToTreasure) {
      return
    }

    let coinRainTimer: number | null = null
    const timer = window.setTimeout(() => {
      setShowFinalScore(true)
      setCoinDrops(createCoinDrops(40))
      setShowCoinRain(true)

      coinRainTimer = window.setTimeout(() => {
        setShowCoinRain(false)
      }, COIN_RAIN_MS)
    }, MASCOT_TRAVEL_MS)

    return () => {
      window.clearTimeout(timer)

      if (coinRainTimer !== null) {
        window.clearTimeout(coinRainTimer)
      }
    }
  }, [isHeadingToTreasure])

  useEffect(() => {
    correctAnswerSoundRef.current = new Audio(ANSWER_SOUND_PATHS.correct)
    wrongAnswerSoundRef.current = new Audio(ANSWER_SOUND_PATHS.wrong)

    correctAnswerSoundRef.current.preload = 'auto'
    wrongAnswerSoundRef.current.preload = 'auto'
    correctAnswerSoundRef.current.volume = 0.9
    wrongAnswerSoundRef.current.volume = 0.9

    return () => {
      correctAnswerSoundRef.current?.pause()
      wrongAnswerSoundRef.current?.pause()
      void fallbackSoundContextRef.current?.close()
      correctAnswerSoundRef.current = null
      wrongAnswerSoundRef.current = null
      fallbackSoundContextRef.current = null
    }
  }, [])

  const playFallbackTone = (isCorrect: boolean) => {
    const AudioContextClass = window.AudioContext

    if (!AudioContextClass) {
      return
    }

    const playTone = (audioContext: AudioContext) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const now = audioContext.currentTime
      const duration = isCorrect ? 0.28 : 0.22

      oscillator.type = isCorrect ? 'triangle' : 'square'
      oscillator.frequency.setValueAtTime(isCorrect ? 740 : 220, now)
      oscillator.frequency.exponentialRampToValueAtTime(
        isCorrect ? 1040 : 160,
        now + duration,
      )

      gainNode.gain.setValueAtTime(0.0001, now)
      gainNode.gain.exponentialRampToValueAtTime(0.16, now + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(now)
      oscillator.stop(now + duration)
    }

    const audioContext =
      fallbackSoundContextRef.current ?? new AudioContextClass()

    fallbackSoundContextRef.current = audioContext

    if (audioContext.state === 'suspended') {
      void audioContext.resume().then(() => playTone(audioContext))
      return
    }

    playTone(audioContext)
  }

  const playAnswerSound = (isCorrect: boolean) => {
    const answerSound = isCorrect
      ? correctAnswerSoundRef.current
      : wrongAnswerSoundRef.current

    if (!answerSound) {
      playFallbackTone(isCorrect)
      return
    }

    answerSound.pause()
    answerSound.currentTime = 0
    const playPromise = answerSound.play()

    if (playPromise === undefined) {
      return
    }

    void playPromise.catch(() => {
      playFallbackTone(isCorrect)
    })
  }

  const handleConfirmAnswer = () => {
    if (selectedOption === null || !currentStage || isAnswerLocked) {
      return
    }

    const isCorrect = selectedOption === currentStage.correctAnswer
    const pointsEarned = isCorrect ? currentStage.points : 0

    playAnswerSound(isCorrect)
    setIsAnswerLocked(true)
    setStageResults((previous) => [
      ...previous,
      {
        stageId: currentStage.id,
        isCorrect,
        pointsEarned,
        selectedOption,
      },
    ])
  }

  const handleAdvance = () => {
    if (!isAnswerLocked) {
      return
    }

    const isLastStage = currentStageIndex >= totalStages - 1

    if (isLastStage) {
      setSelectedOption(null)
      setIsAnswerLocked(false)
      setMascotTargetIndex(currentStageIndex)
      setOpenedStageIndex(null)
      setPendingStageIndex(null)
      return
    }

    const nextStageIndex = currentStageIndex + 1
    setSelectedOption(null)
    setIsAnswerLocked(false)
    setCurrentStageIndex(nextStageIndex)
    setMascotTargetIndex(currentStageIndex)
    setOpenedStageIndex(null)
    setPendingStageIndex(null)
  }

  const handleRestart = () => {
    setHasStarted(true)
    setLayoutSeed(Math.floor(Math.random() * 1_000_000))
    setCurrentStageIndex(0)
    setOpenedStageIndex(null)
    setMascotTargetIndex(null)
    setPendingStageIndex(null)
    setSelectedOption(null)
    setStageResults([])
    setIsAnswerLocked(false)
    setShowFinalScore(false)
    setIsHeadingToTreasure(false)
    setShowCoinRain(false)
    setCoinDrops([])
  }

  const handleOpenStage = (stageIndex: number) => {
    setMascotTargetIndex(stageIndex)
    setOpenedStageIndex(null)
    setSelectedOption(null)

    if (stageIndex !== currentStageIndex || gameFinished) {
      setPendingStageIndex(null)
      return
    }

    setPendingStageIndex(stageIndex)
  }

  const handleCloseModal = () => {
    if (isAnswerLocked) {
      return
    }

    setOpenedStageIndex(null)
    setPendingStageIndex(null)
    setSelectedOption(null)
  }

  const handleOpenTreasure = () => {
    if (!gameFinished || showFinalScore || isHeadingToTreasure) {
      return
    }

    setMascotTargetIndex(null)
    setOpenedStageIndex(null)
    setPendingStageIndex(null)
    setIsHeadingToTreasure(true)
  }

  if (!hasStarted) {
    return (
      <main className="app-shell app-shell-intro">
        <section className="intro-screen">
          <div className="intro-card">
            <p className="eyebrow">Classroom Adventure</p>
            <h1>Find the Treasure Box</h1>
            <p className="hero-text">
              Guide the bird across the islands, answer each question, and
              unlock the clues that lead to the hidden treasure box.
            </p>
            <div className="intro-actions">
              <button
                className="primary-button intro-button"
                type="button"
                onClick={() => setHasStarted(true)}
              >
                Start
              </button>
              <button
                className="secondary-button intro-secondary-button"
                type="button"
                onClick={() => setShowInstructions(true)}
              >
                Instructions
              </button>
            </div>
          </div>
        </section>

        {showInstructions ? (
          <section className="modal-backdrop">
            <section className="question-card question-window instructions-window">
              <div className="question-header">
                <div>
                  <p className="section-label">Adventure guide</p>
                  <h2>How to play</h2>
                </div>
                <button
                  className="close-button"
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  aria-label="Close instructions"
                >
                  x
                </button>
              </div>
              <p className="question-story">
                Move from island to island, answer the questions, and help the mascot
                reach the treasure at the end of the route.
              </p>
              <ol className="instructions-list">
                {INTRO_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <button
                className="primary-button"
                type="button"
                onClick={() => setShowInstructions(false)}
              >
                Got it
              </button>
            </section>
          </section>
        ) : null}
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="game-layout">
        <GameBoard
          key={layoutSeed}
          stages={MY_APP_DATA}
          currentStageIndex={currentStageIndex}
          layoutSeed={layoutSeed}
          stageResults={stageResults}
          mascotMood={mascotMood}
          gameFinished={gameFinished}
          mascotTargetIndex={mascotTargetIndex}
          isHeadingToTreasure={isHeadingToTreasure}
          openedStageIndex={openedStageIndex}
          onOpenStage={handleOpenStage}
          onOpenTreasure={handleOpenTreasure}
        />

        {gameFinished && showFinalScore ? (
          <section className="finish-overlay">
            {showCoinRain ? (
              <div className="coin-rain" aria-hidden="true">
                {coinDrops.map((coin) => (
                  <img
                    key={coin.id}
                    className="coin-drop"
                    src={coin.image}
                    alt=""
                    style={{
                      left: `${coin.left}%`,
                      width: `${coin.size}px`,
                      height: `${coin.size}px`,
                      animationDuration: `${coin.duration}s`,
                      animationDelay: `${coin.delay}s`,
                      rotate: `${coin.rotation}deg`,
                    }}
                  />
                ))}
              </div>
            ) : null}
            <section className="finish-card finish-card-floating">
              <p className="finish-label">Final destination</p>
              <h2>The mascot found the treasure!</h2>
              <p>
                The team completed {completedStages} stages and collected{' '}
                <strong>{totalScore}</strong> points on the way to the treasure
                cave.
              </p>
              <div className="finish-metrics">
                <div>
                  <span>Correct answers</span>
                  <strong>
                    {stageResults.filter((result) => result.isCorrect).length}/
                    {totalStages}
                  </strong>
                </div>
                <div>
                  <span>Adventure rating</span>
                  <strong>{perfectRun ? 'Legendary' : 'Brave Explorer'}</strong>
                </div>
              </div>
              <button className="primary-button" type="button" onClick={handleRestart}>
                Play Again
              </button>
            </section>
          </section>
        ) : null}
      </section>

      {!gameFinished && currentStage && openedStageIndex === currentStageIndex ? (
        <QuestionModal
          stage={currentStage}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          onConfirm={handleConfirmAnswer}
          onNext={handleAdvance}
          onClose={handleCloseModal}
          answerLocked={isAnswerLocked}
          latestResult={latestResult}
        />
      ) : null}
    </main>
  )
}

export default App
