import { Typography } from '@mui/material'
import { useLayoutEffect, useRef, useState } from 'react'
import Marquee from 'react-fast-marquee'

export function MarqueeText({
  text,
  isActive,
  isHovered = false
}: {
  text: string
  isActive: boolean
  isHovered?: boolean
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)
  const [isMarqueeMounted, setIsMarqueeMounted] = useState(false)
  // Add this inside the component, before the return:
  const measureRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const measureEl = measureRef.current
    const containerEl = containerRef.current
    if (!measureEl || !containerEl) return

    const checkOverflow = (): void => {
      // Measure the actual text, not the marquee-manipulated DOM
      const hasOverflow = measureEl.scrollWidth > containerEl.clientWidth - 2
      setNeedsMarquee(hasOverflow)
    }

    checkOverflow()
    const ro = new ResizeObserver(checkOverflow)
    ro.observe(containerEl)
    return () => ro.disconnect()
  }, [text])

  // ── DERIVED STATE: Compute during render (no useEffect needed) ──
  const shouldAnimate = needsMarquee && (isActive || isHovered)

  // ── SIDE EFFECT: Mount/unmount Marquee with rAF delay ──
  useLayoutEffect(() => {
    if (shouldAnimate) {
      const raf = requestAnimationFrame(() => setIsMarqueeMounted(true))
      return () => cancelAnimationFrame(raf)
    }
    // Unmount immediately when shouldAnimate becomes false
    setIsMarqueeMounted(false)
    return
  }, [shouldAnimate]) // ✅ Only one dependency, no cascading setState

  // ── Shared styles ──
  const containerStyle: React.CSSProperties = {
    overflow: 'hidden',
    width: '100%',
    ...(needsMarquee
      ? {
          maskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
        }
      : {})
  }

  const textStyle = {
    fontSize: '0.75rem',
    color: isActive ? '#6384ff' : 'text.primary',
    fontWeight: isActive ? 600 : 400,
    whiteSpace: 'nowrap',
    display: 'inline-block',
    pr: 6
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Hidden element for accurate overflow measurement */}
      <span
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem', // Match your text style
          fontWeight: isActive ? 600 : 400
        }}
      >
        {text}
      </span>

      {isMarqueeMounted ? (
        <Marquee
          play={true}
          speed={25}
          gradient={false}
          pauseOnHover={false}
          style={{ overflow: 'visible', willChange: 'transform' }}
        >
          <Typography variant="caption" sx={{ ...textStyle, willChange: 'transform' }}>
            {text}
          </Typography>
        </Marquee>
      ) : (
        <Typography
          variant="caption"
          sx={{
            ...textStyle,
            display: 'block',
            pr: 0,
            // Smooth fade when switching to marquee
            transition: 'opacity 0.1s ease-out',
            opacity: shouldAnimate ? 0 : 1 // Fade out just before marquee appears
          }}
        >
          {text}
        </Typography>
      )}
    </div>
  )
}
