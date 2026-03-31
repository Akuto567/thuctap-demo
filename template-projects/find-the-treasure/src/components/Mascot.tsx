import type { MascotMood } from '../types'

const mascotImage = '/images/Chicky.png'

type MascotProps = {
  position: {
    top: number
    left: number
  }
  mood: MascotMood
}

export function Mascot({ position, mood }: MascotProps) {
  return (
    <div
      className={`mascot mascot-${mood}`}
      style={{ top: `${position.top}px`, left: `${position.left + 35}px` }}
    >
      <img src={mascotImage} alt="Treasure hunt mascot" />
    </div>
  )
}
