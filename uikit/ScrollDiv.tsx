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
  const contentRef = useRef<HTMLDivElement>()
  const trackRef = useRef<HTMLDivElement>()
  const thumbRef = useRef<HTMLDivElement>()

  const isThumbActive = useBFlag(false)
  const isThumbHovered = useBFlag(false)
  const isContainerHovered = useBFlag(false)
  const isTrackHovered = useBFlag(false)

  // css variable: --content-avaliable-scroll-height to element: OuterConent (>1 px number. e.g 3000px )
  const contentAvaliableScrollHeight = useRef(0)

  // css variable: --track-avaliable-scroll-height to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link contentClientHeight})
  const trackHeight = useRef(0)

  // css variable: --content-client-height to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link totalScrollOfScrollTrack})
  const contentClientHeight = useRef(0)

  // css variable: --scroll-top to element: OuterConent (0 ~ 1 number)
  const scrollTop = useRef(0)

  useHover(outerContainerRef, {
    onHover({ is }) {
      isContainerHovered.set(is === 'start')
    }
  })
  useHover(thumbRef, {
    onHover({ is }) {
      isThumbHovered.set(is === 'start')
    }
  })
  useHover(trackRef, {
    onHover({ is }) {
      isTrackHovered.set(is === 'start')
    }
  })
  useActive(thumbRef, {
    onActive({ is }) {
      isThumbActive.set(is === 'start')
    }
  })
  // add innerContent listener
  useEffect(() => {
    if (!contentRef.current) return
    contentRef.current.addEventListener(
      'scroll',
      (ev) => {
        if (isThumbActive.isOn()) return
        if (!outerContainerRef.current || !contentRef.current) return
        const contentEl = ev.target as HTMLDivElement
        const avaliableScroll = Number(
          getCssVariable(outerContainerRef.current, 'content-avaliable-scroll-height') || '0'
        )
        console.log('avaliable: ', avaliableScroll)
        const currentScrollTop = contentEl.scrollTop / avaliableScroll
        setCssVarible(outerContainerRef.current, 'scroll-top', currentScrollTop)
        scrollTop.current = currentScrollTop
      },
      { passive: true }
    )
  }, [])

  function scrollCotentWithScrollTop() {
    contentRef.current?.scrollTo({
      top: Math.min(1, Math.max(0, scrollTop.current)) * contentAvaliableScrollHeight.current
    })
  }

  // add scroll thumb listener ------
  useEffect(() => {
    const eventId = attachPointerMove(thumbRef.current, {
      start() {
        setDataSet(thumbRef.current, 'isScrollThumbActive', true)
        isThumbActive.on()
      },
      end() {
        setDataSet(thumbRef.current, 'isScrollThumbActive', false)
        isThumbActive.off()
      },
      move: ({ currentDeltaInPx }) => {
        const avaliableScroll = Number(getCssVariable(thumbRef.current, 'avaliable-scroll-height') || '0')
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
    if (!contentRef.current) return
    const totalScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight
    setCssVarible(outerContainerRef.current, 'content-avaliable-scroll-height', String(totalScroll))
    contentAvaliableScrollHeight.current = totalScroll
  }, [])

  // add --track-height as soon as scrollbar is available
  useEffect(() => {
    if (!trackRef.current || !thumbRef.current) return
    const totalScroll = trackRef.current.clientHeight
    setCssVarible(outerContainerRef.current, 'track-height', String(totalScroll))
    trackHeight.current = totalScroll
  }, [])

  // add --content-client-height as soon as innerContent is available
  useEffect(() => {
    if (!contentRef.current) return
    const clientHeight = contentRef.current.clientHeight
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
                isContainerHovered: isContainerHovered.value,
                isTrackHovered: isTrackHovered.value,
                isThumbHovered: isThumbHovered.value,
                isThumbActive: isThumbActive.value
              }
            ]),
          trackClassName
        ]}
        domRef={trackRef}
      >
        <Div
          className={[
            'ScrollDiv-scrollbar-thumb absolute right-0 w-full',
            !noDefaultThumbTint &&
              shrinkToValue(thumb, [
                {
                  isContainerHovered: isContainerHovered.value,
                  isTrackHovered: isTrackHovered.value,
                  isThumbHovered: isThumbHovered.value,
                  isThumbActive: isThumbActive.value
                }
              ]),
            thumbClassName
          ]}
          domRef={thumbRef}
          style={{
            ['--thumb-height']:
              'calc((var(--content-client-height, 0) / var(--content-avaliable-scroll-height, 0)) * var(--track-height) )',
            ['--available-scroll-height']: 'calc((var(--track-height, 0)) - var(--thumb-height, 0))',
            height: 'calc(var(--thumb-height) * 1px)',
            top: 'clamp(0px, var(--scroll-top, 0) * var(--available-scroll-height) * 1px, var(--available-scroll-height) * 1px)'
          }}
        />
      </Div>
      <Div className={['ScrollDiv-inner-content w-full h-full overflow-auto no-native-scrollbar']} domRef={contentRef}>
        {children}
      </Div>
    </Div>
  )
}
