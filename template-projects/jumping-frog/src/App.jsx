import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { MY_QUESTIONS, shuffleQuestionOptions, normalizeOption } from './data'

const SOUND_CROAK = new Audio('./assets/sounds/frog-croak.mp3')
const SOUND_SPLASH = new Audio('./assets/sounds/e-water-splash-short.mp3')

const playSound = (sound) => {
  sound.currentTime = 0
  sound.play().catch(() => {})
}

const START_POSITION = { x: 50, y: 88 }
const CAMERA_FOCUS = { x: 50, y: 88 }
/** Vi tri dich tren khung nhin (%): giua tren — khop voi vung Finish / dao o UI */
const FINISH_VIEWPORT_POSITION = { x: 50, y: 24 }

/** @typedef {{ label?: string, image?: string, icon?: string }} QuizOption */

const VIEWPORT_WAVE_LAYOUT = [
  { key: 'A', x: 25, y: 70 },
  { key: 'B', x: 50, y: 46 },
  { key: 'C', x: 75, y: 70 },
]

const getCameraOffset = (position) => ({
  x: CAMERA_FOCUS.x - position.x,
  y: CAMERA_FOCUS.y - position.y,
})

const getWorldPointFromViewport = (position, cameraOffset) => ({
  x: position.x - cameraOffset.x,
  y: position.y - cameraOffset.y,
})

const getLilypadLayout = (cameraOffset) =>
  VIEWPORT_WAVE_LAYOUT.map((pad) => ({
    key: pad.key,
    x: pad.x - cameraOffset.x,
    y: pad.y - cameraOffset.y,
  }))

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [perchPosition, setPerchPosition] = useState(START_POSITION)
  const [frogPosition, setFrogPosition] = useState(START_POSITION)
  const [frogState, setFrogState] = useState('idle')
  const [pondMotion, setPondMotion] = useState(0)
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 })
  const [stagePhase, setStagePhase] = useState('visible')
  const [score, setScore] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem('highScore') ?? '0', 10)
    return Number.isNaN(saved) ? 0 : saved
  })
  const [selectedLilypad, setSelectedLilypad] = useState(null)
  const [feedback, setFeedback] = useState('idle')
  const [isAnimating, setIsAnimating] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [splash, setSplash] = useState(null)
  const [showGuideline, setShowGuideline] = useState(false)
  const timeoutsRef = useRef([])
  const animationFrameRef = useRef(null)
  const perchPositionRef = useRef(START_POSITION)
  const frogPositionRef = useRef(START_POSITION)

  const activeQuestion = MY_QUESTIONS[Math.min(currentQuestion, MY_QUESTIONS.length - 1)]
  const shuffled = useMemo(
    () => shuffleQuestionOptions(MY_QUESTIONS[Math.min(currentQuestion, MY_QUESTIONS.length - 1)]),
    [currentQuestion],
  )
  const activeLilypads = getLilypadLayout(cameraOffset)
  const animatedLilypads = activeLilypads.map((pad, index) => ({
    ...pad,
    waveOrder: index,
    x: pad.x + Math.sin(pondMotion * 0.9 + currentQuestion * 0.75 + index * 1.4) * 1.6,
    y: pad.y + Math.cos(pondMotion * 1.1 + currentQuestion * 0.65 + index * 1.2) * 1.1,
  }))
  const progress = Math.round((completedCount / MY_QUESTIONS.length) * 100)

  const finishWorldPoint = useMemo(
    () => getWorldPointFromViewport(FINISH_VIEWPORT_POSITION, cameraOffset),
    [cameraOffset],
  )
  const isLastQuestion = currentQuestion === MY_QUESTIONS.length - 1

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('highScore', score.toString())
    }
  }, [score, highScore])

  useEffect(() => {
    let motionFrameId = 0
    const motionStartedAt = performance.now()

    const tickMotion = (now) => {
      setPondMotion((now - motionStartedAt) / 1000)
      motionFrameId = window.requestAnimationFrame(tickMotion)
    }

    motionFrameId = window.requestAnimationFrame(tickMotion)

    return () => {
      window.cancelAnimationFrame(motionFrameId)
    }
  }, [])

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    perchPositionRef.current = perchPosition
  }, [perchPosition])

  useEffect(() => {
    frogPositionRef.current = frogPosition
  }, [frogPosition])

  const queueTimeout = (callback, delay) => {
    const timeoutId = window.setTimeout(callback, delay)
    timeoutsRef.current.push(timeoutId)
  }

  const clearTimers = () => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    timeoutsRef.current = []
  }

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const animateFrogJump = (target, onComplete) => {
    stopAnimation()

    const start = frogPositionRef.current
    const deltaX = target.x - start.x
    const deltaY = target.y - start.y
    const arcHeight = 16 + Math.abs(deltaX) * 0.22
    const direction = deltaX === 0 ? 0 : deltaX > 0 ? 1 : -1
    const duration = 760
    const startedAt = performance.now()

    setFrogState('jumping')

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const easedProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

      const nextX = start.x + deltaX * easedProgress
      const nextY = start.y + deltaY * easedProgress - Math.sin(progress * Math.PI) * arcHeight
      const rotate = `${Math.sin(progress * Math.PI) * direction * 10}deg`
      const scale = (1 + Math.sin(progress * Math.PI) * 0.06).toFixed(3)

      setFrogPosition({
        x: nextX,
        y: nextY,
        rotate,
        scale,
      })

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick)
        return
      }

      animationFrameRef.current = null
      setFrogPosition({
        x: target.x,
        y: target.y,
        rotate: '0deg',
        scale: '1',
      })
      setFrogState('landing')
      onComplete()
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)
  }

  const resetRoundState = (nextPerch = perchPositionRef.current) => {
    stopAnimation()
    setSelectedLilypad(null)
    setFeedback('idle')
    setIsAnimating(false)
    setSplash(null)
    setFrogPosition(nextPerch)
    setPerchPosition(nextPerch)
    setFrogState('idle')
  }

  const handleLilypadSelect = (index) => {
    if (isAnimating || gameOver) return

    setSelectedLilypad(index)
    const isCorrectAnswer = index === shuffled.correctDisplayIndex

    if (!isCorrectAnswer) {
      setFeedback('wrong')
      setIsAnimating(true)
      playSound(SOUND_SPLASH)
      const targetPad = activeLilypads[index]
      animateFrogJump(
        {
          x: targetPad.x,
          y: targetPad.y,
        },
        () => {
          queueTimeout(() => {
            setSplash({ x: targetPad.x, y: targetPad.y + 6, key: `${Date.now()}` })
            setFrogState('sinking')
            setFrogPosition((previous) => ({
              ...previous,
              y: previous.y + 16,
              scale: '0.88',
              rotate: '8deg',
            }))
          }, 90)

          queueTimeout(() => {
            setFrogPosition((previous) => ({
              ...previous,
              y: previous.y + 18,
              scale: '0.74',
              rotate: '-6deg',
            }))
          }, 260)

          queueTimeout(() => {
            setSplash(null)
          }, 780)

          queueTimeout(() => {
            resetRoundState(perchPositionRef.current)
          }, 980)
        },
      )
      return
    }

    setFeedback(currentQuestion === MY_QUESTIONS.length - 1 ? 'finished' : 'correct')
    setIsAnimating(true)
    playSound(SOUND_CROAK)
    const targetPad = activeLilypads[index]
    animateFrogJump(
      {
        x: targetPad.x,
        y: targetPad.y,
      },
      () => {
        const nextPerch = {
          x: targetPad.x,
          y: targetPad.y,
        }

        queueTimeout(() => {
          setScore((previous) => previous + 10)
          setCompletedCount((previous) => previous + 1)

          if (currentQuestion === MY_QUESTIONS.length - 1) {
            const finishTarget = getWorldPointFromViewport(FINISH_VIEWPORT_POSITION, cameraOffset)

            animateFrogJump(finishTarget, () => {
              setGameOver(true)
              setIsAnimating(false)
              setFrogState('celebrate')
              setPerchPosition(finishTarget)
            })
            return
          }

          queueTimeout(() => {
            setStagePhase('hidden')
            setCurrentQuestion((previous) => previous + 1)
            setCameraOffset(getCameraOffset(nextPerch))
            resetRoundState(nextPerch)
            queueTimeout(() => {
              setStagePhase('entering')
              queueTimeout(() => {
                setStagePhase('visible')
              }, 760)
            }, 560)
          }, 240)
        }, 280)
      },
    )
  }

  const restartGame = () => {
    clearTimers()
    stopAnimation()
    setCurrentQuestion(0)
    setPerchPosition(START_POSITION)
    setCameraOffset({ x: 0, y: 0 })
    setStagePhase('visible')
    setScore(0)
    setCompletedCount(0)
    setGameOver(false)
    resetRoundState(START_POSITION)
  }

  const statusMessage = gameOver
    ? 'Tuyet voi! Chu ech da cham den bo ben kia.'
    : feedback === 'wrong'
      ? 'Sai mat roi, thu nhay sang mot beo khac nhe.'
      : feedback === 'correct'
        ? 'Chinh xac! Chu ech dang lay da cho cau tiep theo.'
        : feedback === 'finished'
          ? 'Cau cuoi dung roi, chu ech dang cap bo!'
          : 'Hay chon mot beo de tra loi.'

  return (
    <div className="app-shell">
      <div className="game-stage">
        <section className="pond-card">
          <div
            className="pond-scene"
            style={{
              '--water-shift-x': `${cameraOffset.x * 18}px`,
              '--water-shift-y': `${cameraOffset.y * 18}px`,
            }}
          >
            <div className="pond-haze" />
            <div className="start-zone" aria-hidden="true">
              <div className="start-zone__badge">Start</div>
            </div>
            <div
              className="scene-world"
              style={{
                '--camera-x': `${cameraOffset.x}%`,
                '--camera-y': `${cameraOffset.y}%`,
              }}
            >
              <div className="pond-ripple pond-ripple--one" />
              <div className="pond-ripple pond-ripple--two" />
              {splash ? (
                <div
                  key={splash.key}
                  className="splash"
                  style={{
                    '--splash-x': `${splash.x}%`,
                    '--splash-y': `${splash.y}%`,
                  }}
                  aria-hidden="true"
                />
              ) : null}
              {!gameOver && (
                <div
                  className="perch-pad"
                  style={{
                    '--perch-x': `${perchPosition.x}%`,
                    '--perch-y': `${perchPosition.y}%`,
                  }}
                  aria-hidden="true"
                />
              )}

              {isLastQuestion ? (
                <div
                  className="finish-zone finish-zone--in-scene"
                  style={{
                    '--finish-x': `${finishWorldPoint.x}%`,
                    '--finish-y': `${finishWorldPoint.y}%`,
                  }}
                  aria-hidden="true"
                >
                  <div className="finish-zone__badge">Finish</div>
                  <div className="finish-zone__island finish-zone__island--celebrate" />
                </div>
              ) : null}

              {animatedLilypads.map((pad, index) => {
                const { option } = shuffled.ordered[index]
                const stateClass =
                  selectedLilypad === index
                    ? feedback === 'wrong'
                      ? 'is-wrong'
                      : 'is-correct'
                    : ''
                const ariaBits = [option.label, option.image].filter(Boolean).join(' ').trim()

                return (
                  <button
                    key={`${currentQuestion}-${pad.key}`}
                    className={`lilypad ${stateClass} lilypad--${stagePhase}`}
                    style={{
                      '--pad-x': `${pad.x}%`,
                      '--pad-y': `${pad.y}%`,
                      '--delay': `${pad.waveOrder * 140}ms`,
                    }}
                    type="button"
                    onClick={() => handleLilypadSelect(index)}
                    disabled={isAnimating || gameOver || stagePhase !== 'visible'}
                    aria-label={ariaBits ? `${pad.key}. ${ariaBits}` : `${pad.key}. Hinh minh hoa`}
                  >
                    <span className="lilypad-key">{pad.key}</span>
                    <span className="lilypad-content">
                      {option.image ? (
                        option.image.startsWith('http') || option.image.startsWith('/') || option.image.includes('.') ? (
                          <img
                            className="lilypad-media"
                            src={option.image}
                            alt={option.label || 'Dap an'}
                            draggable={false}
                          />
                        ) : (
                          <span className="lilypad-icon" aria-hidden="true">
                            {option.image}
                          </span>
                        )
                      ) : null}
                      {option.label ? <span className="lilypad-text">{option.label}</span> : null}
                    </span>
                  </button>
                )
              })}

              <div
                className={`frog frog--${frogState}`}
                style={{
                  '--frog-x': `${frogPosition.x}%`,
                  '--frog-y': `${frogPosition.y}%`,
                  '--frog-rotate': frogPosition.rotate ?? '0deg',
                  '--frog-scale': frogPosition.scale ?? '1',
                }}
                aria-hidden="true"
              />

              <div className="reeds reeds--left" aria-hidden="true" />
              <div className="reeds reeds--right" aria-hidden="true" />
            </div>
          </div>
        </section>

        <div className={`game-ui${gameOver ? ' game-ui--ended' : ''}`}>
          <header className="game-ui__hud">
            <div className="game-ui__brand">
              <span className="eyebrow">Frog Quiz</span>
            </div>
            <div className="hero-stats hero-stats--compact">
              <article className="stat-card">
                <span className="stat-label">Diem</span>
                <strong>{score}</strong>
              </article>
              <article className="stat-card">
                <span className="stat-label">Ky luc</span>
                <strong>{highScore}</strong>
              </article>
              <article className="stat-card">
                <span className="stat-label">Da qua</span>
                <strong>
                  {completedCount}/{MY_QUESTIONS.length}
                </strong>
              </article>
            </div>
          </header>

          <div className="game-ui__panel">
            <article className="question-card question-card--overlay">
              <div className="question-card__header">
                <span className="question-pill">Cau {Math.min(currentQuestion + 1, MY_QUESTIONS.length)}</span>
                <span className="question-pill question-pill--soft">{progress}% hoan thanh</span>
              </div>

              <h2>{gameOver ? 'Chu ech da sang bo ben kia!' : activeQuestion.question}</h2>

              <div className="progress-track" aria-hidden="true">
                <span className="progress-track__fill" style={{ width: `${progress}%` }} />
              </div>

              <p className={`status-banner status-banner--${feedback === 'idle' && !gameOver ? 'idle' : feedback}`}>
                {statusMessage}
              </p>

              <div className="question-footer">
                <p>
                  {gameOver
                    ? 'Choi lai hoac thay bo cau hoi trong code.'
                    : 'Beo xao ngau nhien; dap an co the la chu, emoji hoac hinh.'}
                </p>
                <button className="ghost-button" type="button" onClick={restartGame}>
                  {gameOver ? 'Choi lai' : 'Lam moi man choi'}
                </button>
              </div>
            </article>
          </div>

          <button
            className="guideline-toggle"
            onClick={() => setShowGuideline(!showGuideline)}
            aria-label="Hướng dẫn"
          >
            {showGuideline ? '✕' : '?'}
          </button>

          {showGuideline && (
            <div className="game-guideline">
              <h3>Hướng dẫn chơi</h3>
              <ol>
                <li>Đọc câu hỏi hiển thị bên trên</li>
                <li>Chọn đáp án đúng bằng cách bấm vào bèo</li>
                <li>Nếu đúng, ếch sẽ nhảy sang bèo đó và được cộng điểm</li>
                <li>Nếu sai, ếch sẽ rơi xuống nước và phải thử lại</li>
                <li>Trả lời hết các câu hỏi để đến đích!</li>
              </ol>
            </div>
          )}

          <p className="game-ui__hint">Cham beo dung de chu ech nhay qua ho.</p>
        </div>
      </div>
    </div>
  )
}

export default App
