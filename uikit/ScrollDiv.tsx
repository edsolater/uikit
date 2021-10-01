import { ReactNode, useEffect, useRef } from 'react'
import { getCssVariable, setCssVarible } from '../functions/dom/cssVariable'
import { setDataSet } from '../functions/dom/dataset'
import { attachPointerMove, cancelPointerMove } from '../functions/dom/gesture/pointerMove'
import { useHover } from '../hooks/useHover'
import Div, { DivProps } from './Div'
import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'
import useBFlag from '../hooks/useBFlag'
import { useActive } from '../hooks/useActive'

type ScrollDivTintProps = {
  noDefaultThumbTint?: boolean
  thumbTint?: {}

  noDefaultTrackTint?: boolean
  trackTint?: {}
}

type ScrollDivReturnedTintBlock = {
  track:
    | string
    | ((status: {
        isThumbHovered: boolean
        isThumbActive: boolean
        isTrackHovered: boolean
        isContainerHovered: boolean
      }) => string)
  thumb:
    | string
    | ((status: {
        isThumbHovered: boolean
        isThumbActive: boolean
        isTrackHovered: boolean
        isContainerHovered: boolean
      }) => string)
}

const scrollDivTint = (
  thumbTintOptions: ScrollDivTintProps['thumbTint'] = {},
  trackTintOptions: ScrollDivTintProps['trackTint'] = {}
): ScrollDivReturnedTintBlock => {
  return {
    'track': ({ isTrackHovered }) => `transition ${isTrackHovered ? 'w-4' : 'w-2'}`,
    'thumb': ({ isContainerHovered }) =>
      `h-8 transition active:bg-opacity-100 hover:bg-opacity-80  ${
        isContainerHovered ? 'bg-opacity-60' : 'bg-opacity-20'
      } bg-block-primary`
  }
}

interface ScrollDivProps extends DivProps, ScrollDivTintProps {
  children?: ReactNode
  className?: string
  trackClassName?: string
  thumbClassName?: string
}
// for high response of interaction, don't use React state
export default function ScrollDiv({
  children,
  className,
  trackClassName,
  thumbClassName,
  thumbTint,
  noDefaultThumbTint,
  trackTint,
  noDefaultTrackTint
}: ScrollDivProps) {
  const outerContainerRef = useRef<HTMLDivElement>()
  const scrollInnerContentRef = useRef<HTMLDivElement>()
  const scrollTrackRef = useRef<HTMLDivElement>()
  const scrollThumbRef = useRef<HTMLDivElement>()

  const isScrollThumbActive = useBFlag(false)
  const isScrollThumbHovered = useBFlag(false)
  const isScrollContainerHovered = useBFlag(false)
  const isScrollTrackHovered = useBFlag(false)

  // css variable: --content-scroll-height to element: OuterConent (>1 px number. e.g 3000px )
  const totalScrollOfInnerContent = useRef(0)

  // css variable: --track-scroll-height to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link contentClientHeight})
  const totalScrollOfScrollTrack = useRef(0)

  // css variable: --content-client-height to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link totalScrollOfScrollTrack})
  const contentClientHeight = useRef(0)

  // css variable: --scroll-top to element: OuterConent (0 ~ 1 number)
  const scrollTop = useRef(0)

  useHover(outerContainerRef, {
    onHover({ is }) {
      isScrollContainerHovered.set(is === 'start')
    }
  })
  useHover(scrollThumbRef, {
    onHover({ is }) {
      isScrollThumbHovered.set(is === 'start')
    }
  })
  useHover(scrollTrackRef, {
    onHover({ is }) {
      isScrollTrackHovered.set(is === 'start')
    }
  })
  useActive(scrollThumbRef, {
    onActive({ is }) {
      isScrollThumbActive.set(is === 'start')
    }
  })
  // add innerContent listener
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    scrollInnerContentRef.current.addEventListener(
      'scroll',
      (ev) => {
        if (isScrollThumbActive.isOn()) return
        if (!outerContainerRef.current || !scrollInnerContentRef.current) return
        const contentEl = ev.target as HTMLDivElement
        const avaliableScroll = Number(getCssVariable(outerContainerRef.current, 'content-scroll-height') || '0')
        const currentScrollTop = contentEl.scrollTop / avaliableScroll
        setCssVarible(outerContainerRef.current, 'scroll-top', currentScrollTop)
        scrollTop.current = currentScrollTop
      },
      { passive: true }
    )
  }, [])

  function scrollCotentWithScrollTop() {
    scrollInnerContentRef.current?.scrollTo({
      top: Math.min(1, Math.max(0, scrollTop.current)) * totalScrollOfInnerContent.current
    })
  }

  // add scroll thumb listener ------
  useEffect(() => {
    const eventId = attachPointerMove(scrollThumbRef.current, {
      start() {
        setDataSet(scrollThumbRef.current, 'isScrollThumbActive', true)
        isScrollThumbActive.on()
      },
      end() {
        setDataSet(scrollThumbRef.current, 'isScrollThumbActive', false)
        isScrollThumbActive.off()
      },
      move: ({ currentDeltaInPx }) => {
        const avaliableScroll = Number(getCssVariable(outerContainerRef.current, 'track-scroll-height') || '0')
        setCssVarible(outerContainerRef.current, 'scroll-top', (prev) => {
          const currentScrollTop = Number(prev) + currentDeltaInPx.dy / avaliableScroll
          scrollTop.current = currentScrollTop
          scrollCotentWithScrollTop()
          return currentScrollTop
        })
      }
    })
    return () => cancelPointerMove(eventId)
  }, [])

  // add --total-scroll as soon as innerContent is available
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    const totalScroll = scrollInnerContentRef.current.scrollHeight - scrollInnerContentRef.current.clientHeight
    setCssVarible(outerContainerRef.current, 'content-scroll-height', String(totalScroll))
    totalScrollOfInnerContent.current = totalScroll
  }, [])

  // add --total-scroll as soon as scrollbar is available
  useEffect(() => {
    if (!scrollTrackRef.current || !scrollThumbRef.current) return
    const totalScroll = scrollTrackRef.current.clientHeight - scrollThumbRef.current.clientHeight
    setCssVarible(outerContainerRef.current, 'track-scroll-height', String(totalScroll))
    totalScrollOfScrollTrack.current = totalScroll
  }, [])

  // add --client-height as soon as innerContent is available
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    const clientHeight = scrollInnerContentRef.current.clientHeight
    setCssVarible(outerContainerRef.current, 'content-client-height', String(clientHeight))
    contentClientHeight.current = clientHeight
  }, [])

  const { track, thumb } = scrollDivTint(thumbTint, trackTint)
  return (
    <Div domRef={outerContainerRef} className={['ScrollDiv w-full h-80 relative', className]}>
      <Div
        className={[
          'ScrollDiv-scrollbar-track absolute right-0 top-0 bottom-0',
          !noDefaultTrackTint &&
            shrinkToValue(track, [
              {
                isContainerHovered: isScrollContainerHovered.value,
                isTrackHovered: isScrollTrackHovered.value,
                isThumbHovered: isScrollThumbHovered.value,
                isThumbActive: isScrollThumbActive.value
              }
            ]),
          trackClassName
        ]}
        domRef={scrollTrackRef}
      >
        <Div
          className={[
            'ScrollDiv-scrollbar-thumb absolute right-0 w-full',
            !noDefaultThumbTint &&
              shrinkToValue(thumb, [
                {
                  isContainerHovered: isScrollContainerHovered.value,
                  isTrackHovered: isScrollTrackHovered.value,
                  isThumbHovered: isScrollThumbHovered.value,
                  isThumbActive: isScrollThumbActive.value
                }
              ]),
            thumbClassName
          ]}
          domRef={scrollThumbRef}
          style={{
            height:
              'calc(var(--content-client-height, 0) / var(--content-scroll-height, 0) * var(--track-scroll-height) *1px)',
            top: 'clamp(0px, var(--scroll-top, 0) * var(--track-scroll-height, 0) * 1px, var(--track-scroll-height, 0) * 1px)'
          }}
        />
      </Div>
      <Div
        className={['ScrollDiv-inner-content w-full h-full overflow-auto no-native-scrollbar']}
        domRef={scrollInnerContentRef}
      >
        {children}
      </Div>
    </Div>
  )
}
