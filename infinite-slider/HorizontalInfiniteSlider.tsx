/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {
  cloneElement,
  ElementRef,
  Fragment,
  MouseEvent,
  ReactElement,
  TouchEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useHover } from 'react-aria'

import { debounce } from '../../helpers/debounce'
import { useWindowSize } from '../../hooks/useWindowSize'

type HorizontalInfiniteSliderProps = {
  gap: number
  pauseOnHover?: boolean
  children: ReactElement[]
}

export default function HorizontalInfiniteSlider({
  gap,
  children,
  pauseOnHover,
}: HorizontalInfiniteSliderProps) {
  const [cloneNodeCount, setCloneNodeCount] = useState(1)

  const animationRef = useRef<number | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const currentTransform = useRef<number>(0)
  const cloneNodeCountRef = useRef(0)

  const containerListRef = useRef<ElementRef<'div'>>(null)
  const wrapperRef = useRef<ElementRef<'div'>>(null)

  const { windowSize } = useWindowSize()

  const { hoverProps } = useHover({
    onHoverStart() {
      if (pauseOnHover && animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    },
    onHoverEnd() {
      if (pauseOnHover && !animationRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    },
  })

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0].clientX

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!touchStartXRef.current || !containerListRef.current || !wrapperRef.current) return

      const touchX = event.touches[0].clientX
      const deltaX = touchX - touchStartXRef.current

      const nextTranslateX = currentTransform.current + deltaX

      const containerWidth = containerListRef.current.offsetWidth
      const wrapperWidth = wrapperRef.current.offsetWidth

      const totalNodes = cloneNodeCountRef.current * 2 + 1

      if (Math.abs(nextTranslateX) >= containerWidth - wrapperWidth) {
        const chunkWidth = containerWidth / totalNodes

        const chunksInView = wrapperWidth / chunkWidth

        let translateX = 0

        if (chunksInView > 0) {
          translateX = chunkWidth * (Math.ceil(chunksInView) - chunksInView) + deltaX - gap / 2
        } else {
          translateX = chunkWidth - chunkWidth * chunksInView + deltaX - gap / 2
        }

        currentTransform.current = -translateX
        containerListRef.current.style.transform = `translateX(-${translateX}px)`
      } else if (nextTranslateX >= 0) {
        const translateX = containerWidth / totalNodes + gap / 2

        currentTransform.current = -translateX

        containerListRef.current.style.transform = `translateX(-${translateX}px)`
      } else {
        currentTransform.current = nextTranslateX
        containerListRef.current.style.transform = `translateX(${nextTranslateX}px)`
      }

      touchStartXRef.current = touchX
    },
    [gap],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const enableAnimationOnTouch = useCallback(
    debounce(() => {
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }, 5000),
    [],
  )

  const handleTouchEnd = () => {
    touchStartXRef.current = null

    if (pauseOnHover) {
      enableAnimationOnTouch()
    }
  }

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.clientX
  }

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!touchStartXRef.current || !containerListRef.current || !wrapperRef.current) return

      const touchX = event.clientX
      const deltaX = touchX - touchStartXRef.current

      const nextTranslateX = currentTransform.current + deltaX

      const containerWidth = containerListRef.current.offsetWidth
      const wrapperWidth = wrapperRef.current.offsetWidth
      const totalNodes = cloneNodeCountRef.current * 2 + 1

      if (Math.abs(nextTranslateX) >= containerWidth - wrapperWidth) {
        const chunkWidth = containerWidth / totalNodes

        const chunksInView = wrapperWidth / chunkWidth

        let translateX = 0

        if (chunksInView > 0) {
          translateX = chunkWidth * (Math.ceil(chunksInView) - chunksInView) + deltaX - gap / 2
        } else {
          translateX = chunkWidth - chunkWidth * chunksInView + deltaX - gap / 2
        }

        currentTransform.current = -translateX
        containerListRef.current.style.transform = `translateX(-${translateX}px)`
      } else if (nextTranslateX >= 0) {
        const translateX = containerWidth / totalNodes + gap / 2

        currentTransform.current = -translateX

        containerListRef.current.style.transform = `translateX(-${translateX}px)`
      } else {
        currentTransform.current = nextTranslateX
        containerListRef.current.style.transform = `translateX(${nextTranslateX}px)`
      }

      touchStartXRef.current = touchX
    },
    [gap],
  )

  const handleMouseUp = () => {
    touchStartXRef.current = null
  }

  const animate = useCallback(() => {
    if (!containerListRef.current || !wrapperRef.current) return

    const nextTranslateX = currentTransform.current - 1
    const containerWidth = containerListRef.current.offsetWidth
    const wrapperWidth = wrapperRef.current.offsetWidth

    if (Math.abs(nextTranslateX) >= containerWidth - wrapperWidth) {
      const totalNodes = cloneNodeCountRef.current * 2 + 1

      const chunkWidth = containerWidth / totalNodes

      const chunksInView = wrapperWidth / chunkWidth

      let translateX = 0

      if (chunksInView > 0) {
        translateX = chunkWidth * (Math.ceil(chunksInView) - chunksInView) + 1 - gap / 2
      } else {
        translateX = chunkWidth - chunkWidth * chunksInView + 1 - gap / 2
      }

      currentTransform.current = -translateX
      containerListRef.current.style.transform = `translateX(-${translateX}px)`
    } else {
      currentTransform.current = nextTranslateX
      containerListRef.current.style.transform = `translateX(${nextTranslateX}px)`
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [gap])

  const calculateNodeToClone = useCallback(() => {
    if (!wrapperRef.current || !containerListRef.current) return

    const wrapperWidth = wrapperRef.current.offsetWidth
    const containerWidth = containerListRef.current.offsetWidth

    const nodesToClone = Math.max(
      Math.ceil(wrapperWidth / containerWidth / (cloneNodeCountRef.current || 1)) + 1,
      1,
    )

    setCloneNodeCount(nodesToClone)
    cloneNodeCountRef.current = nodesToClone
  }, [])

  useEffect(() => {
    calculateNodeToClone()
  }, [calculateNodeToClone, windowSize])

  useLayoutEffect(() => {
    animationRef.current = requestAnimationFrame(animate)

    calculateNodeToClone()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='max-w-full overflow-hidden' ref={wrapperRef}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className='flex w-max flex-nowrap'
        style={{
          gap,
        }}
        ref={containerListRef}
        {...hoverProps}
      >
        {[
          ...Array.from({ length: cloneNodeCount }, (_, index) => (
            <Fragment key={`before-${index}`}>
              {children.map((child, childIndex) =>
                cloneElement(child, { key: `before-${index}-${childIndex}`, ...child.props }),
              )}
            </Fragment>
          )),
        ]}

        {children}

        {[
          ...Array.from({ length: cloneNodeCount }, (_, index) => (
            <Fragment key={`after-${index}`}>
              {children.map((child, childIndex) =>
                cloneElement(child, { key: `after-${index}-${childIndex}`, ...child.props }),
              )}
            </Fragment>
          )),
        ]}
      </div>
    </div>
  )
}
