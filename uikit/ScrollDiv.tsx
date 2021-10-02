import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { setCssVarible } from '../functions/dom/cssVariable'
import { attachPointerMove, cancelPointerMove } from '../functions/dom/gesture/pointerMove'
import { useHover } from '../hooks/useHover'
import Div, { DivProps } from './Div'
import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'
import useBFlag from '../hooks/useBFlag'
import addEventListener from '../functions/dom/addEventListener'

type ScrollDivTintProps = {
  noDefaultThumbTint?: boolean
  thumbTint?: {}

  noDefaultTrackTint?: boolean
  trackTint?: {}
}

type ScrollDivReturnedTintBlock = {
  track: string | ((status: { isContainerHovered: boolean; direction: 'x' | 'y' }) => string)
  thumb: string | ((status: { isContainerHovered: boolean; direction: 'x' | 'y' }) => string)
}

const scrollDivTint = (
  thumbTintOptions: ScrollDivTintProps['thumbTint'] = {},
  trackTintOptions: ScrollDivTintProps['trackTint'] = {}
): ScrollDivReturnedTintBlock => {
  return {
    'track': () => ``,
    'thumb': ({ isContainerHovered, direction }) =>
      `transition active:bg-opacity-100 rounded-full hover:bg-opacity-80 ${direction === 'y' ? 'w-2 hover:w-4' : 'h-2 hover:h-4'}  ${
        isContainerHovered ? 'bg-opacity-60' : 'bg-opacity-10'
      } bg-block-primary`
  }
}

interface ScrollDivProps extends DivProps, ScrollDivTintProps {
  children?: ReactNode
  className?: string
  componentRef?: RefObject<any>
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
  const xTrackRef = useRef<HTMLDivElement>()
  const xThumbRef = useRef<HTMLDivElement>()
  const yTrackRef = useRef<HTMLDivElement>()
  const yThumbRef = useRef<HTMLDivElement>()

  const isContainerHovered = useBFlag(false)

  // css variable: --content-avaliable-scroll-height to element: OuterConent (>1 px number. e.g 3000px )
  const [contentAvaliableScrollHeight, setContentAvaliableScrollHeight] = useState<number>(0)
  // css variable: --content-avaliable-scroll-width to element: OuterConent (>1 px number. e.g 3000px )
  const [contentAvaliableScrollWidth, setContentAvaliableScrollWidth] = useState<number>(0)

  // css variable: --content-client-width to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link totalScrollOfScrollTrack})
  const [contentClientWidth, setContentClientWidth] = useState<number>(0)
  // css variable: --content-client-height to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link totalScrollOfScrollTrack})
  const [contentClientHeight, setContentClientHeight] = useState<number>(0)

  // css variable: --content-client-width to element: OuterConent (>1 px number. e.g 240px) (the value is same as {@link totalScrollOfScrollTrack})
  const [contentScrollWidth, setContentScrollWidth] = useState<number>(0)
  // css variable: --content-client-height to element: OuterConent (>1 px number. e.g 240px) (the value is same as {@link totalScrollOfScrollTrack})
  const [contentScrollHeight, setContentScrollHeight] = useState<number>(0)

  // css variable: --scroll-left to element: OuterConent (0 ~ 1 number)
  const scrollLeft = useRef(0)
  // css variable: --scroll-top to element: OuterConent (0 ~ 1 number)
  const scrollTop = useRef(0)

  // css variable: --track-avaliable-scroll-width to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link contentClientHeight})
  const [xTrackWidth, setXTrackWidth] = useState<number>(0)
  // css variable: --track-avaliable-scroll-height to element: OuterConent (>1 px number. e.g 200px) (the value is same as {@link contentClientHeight})
  const [yTrackHeight, setYTrackHeight] = useState<number>(0)

  const xThumbWidth = Math.min((contentClientWidth / contentScrollWidth) * xTrackWidth, xTrackWidth)
  const yThumbHeight = Math.min((contentClientHeight / contentScrollHeight) * yTrackHeight, yTrackHeight)

  const xThumbAvaliableScrollWidth = xTrackWidth - xThumbWidth
  const yThumbAvaliableScrollHeight = yTrackHeight - yThumbHeight

  useHover(outerContainerRef, {
    onHover({ is }) {
      isContainerHovered.set(is === 'start')
    }
  })

  // add innerContent listener
  useEffect(() => {
    if (!contentRef.current) return
    // TODO: abstract to attachScroll()
    const controller = addEventListener(
      contentRef.current,
      'scroll',
      (ev) => {
        if (!outerContainerRef.current || !contentRef.current) return

        const { scrollTop: contentScrollTop, scrollLeft: contentScrollLeft } = ev.target as HTMLDivElement

        const currentScrollTop = contentScrollTop / contentAvaliableScrollHeight || 0
        const currentScrollLeft = contentScrollLeft / contentAvaliableScrollWidth || 0
        setCssVarible(outerContainerRef.current, 'scroll-top', currentScrollTop)
        setCssVarible(outerContainerRef.current, 'scroll-left', currentScrollLeft)
        scrollTop.current = currentScrollTop
        scrollLeft.current = currentScrollLeft
      },
      { passive: true }
    )
    return () => controller.stopListening()
  }, [contentAvaliableScrollHeight, contentAvaliableScrollWidth])

  function syncScrollCotentWithScrollTop() {
    if (!contentAvaliableScrollHeight || !scrollTop.current) return
    contentRef.current?.scrollTo({
      top: Math.min(1, Math.max(0, scrollTop.current)) * contentAvaliableScrollHeight
    })
  }

  function syncScrollCotentWithScrollLeft() {
    if (!contentAvaliableScrollWidth || !scrollLeft.current) return
    contentRef.current?.scrollTo({
      left: Math.min(1, Math.max(0, scrollLeft.current)) * contentAvaliableScrollWidth
    })
  }

  // add scroll thumb listener for y
  useEffect(() => {
    const eventId = attachPointerMove(yThumbRef.current, {
      move: ({ currentDeltaInPx }) => {
        if (!yThumbAvaliableScrollHeight) return
        setCssVarible(outerContainerRef.current, 'scroll-top', (prev) => {
          const currentScrollTop = Number(prev) + currentDeltaInPx.dy / yThumbAvaliableScrollHeight
          scrollTop.current = currentScrollTop
          syncScrollCotentWithScrollTop()
          return currentScrollTop
        })
      }
    })
    return () => cancelPointerMove(eventId) // TODO: use controller like 👆(above code)
  }, [yThumbAvaliableScrollHeight])

  // add scroll thumb listener for x
  useEffect(() => {
    const eventId = attachPointerMove(xThumbRef.current, {
      move: ({ currentDeltaInPx }) => {
        if (!xThumbAvaliableScrollWidth) return
        setCssVarible(outerContainerRef.current, 'scroll-left', (prev) => {
          const currentScrollLeft = Number(prev) + currentDeltaInPx.dx / xThumbAvaliableScrollWidth
          scrollLeft.current = currentScrollLeft
          syncScrollCotentWithScrollLeft()
          return currentScrollLeft
        })
      }
    })
    return () => cancelPointerMove(eventId) // TODO: use controller like 👆(above code)
  }, [xThumbAvaliableScrollWidth])

  // add --content-avaliable-scroll-height and --content-avaliable-scroll-width as soon as innerContent is available
  useEffect(() => {
    if (!contentRef.current) return
    const totalScrollHeight = contentRef.current.scrollHeight - contentRef.current.clientHeight
    setCssVarible(outerContainerRef.current, 'content-avaliable-scroll-height', String(totalScrollHeight))
    setContentAvaliableScrollHeight(totalScrollHeight)

    const totalScrollWidth = contentRef.current.scrollWidth - contentRef.current.clientWidth
    setCssVarible(outerContainerRef.current, 'content-avaliable-scroll-width', String(totalScrollWidth))
    setContentAvaliableScrollWidth(totalScrollWidth)
  }, [])

  // add --track-height as soon as scrollbarY is available
  useEffect(() => {
    if (!yTrackRef.current) return
    setYTrackHeight(yTrackRef.current.clientHeight)
  }, [])

  // add --track-height as soon as scrollbarX is available
  useEffect(() => {
    if (!xTrackRef.current) return
    setXTrackWidth(xTrackRef.current.clientWidth)
  }, [])

  // init content client-height/width and scroll-height/width as soon as innerContent is available
  useEffect(() => {
    if (!contentRef.current) return
    setContentClientHeight(contentRef.current.clientHeight)
    setContentClientWidth(contentRef.current.clientWidth)
    setContentScrollHeight(contentRef.current.scrollHeight)
    setContentScrollWidth(contentRef.current.scrollWidth)
  }, [])

  const { track, thumb } = scrollDivTint(thumbTint, trackTint)
  return (
    <Div nodeName='ScrollDiv' domRef={outerContainerRef} className={['relative', className]}>
      <Div
        nodeName='ScrollDiv--content'
        className='w-full h-full overflow-auto no-native-scrollbar'
        domRef={contentRef}
      >
        {children}
      </Div>
      <Div
        nodeName='ScrollDiv__y-track'
        className={[
          'absolute right-0 top-0 bottom-0',
          !noDefaultTrackTint &&
            shrinkToValue(track, [{ isContainerHovered: isContainerHovered.value, direction: 'y' }]),
          trackClassName
        ]}
        domRef={yTrackRef}
      >
        <Div
          nodeName='ScrollDiv__y-thumb'
          className={[
            'absolute right-0 w-full',
            !noDefaultThumbTint &&
              shrinkToValue(thumb, [{ isContainerHovered: isContainerHovered.value, direction: 'y' }]),
            thumbClassName
          ]}
          domRef={yThumbRef}
          style={{
            height: yThumbHeight,
            top: `clamp(0px, var(--scroll-top, 0) * ${yThumbAvaliableScrollHeight} * 1px, ${yThumbAvaliableScrollHeight} * 1px)`
          }}
        />
      </Div>
      <Div
        nodeName='ScrollDiv__x-track'
        className={[
          'absolute left-0 right-0 bottom-0',
          !noDefaultTrackTint &&
            shrinkToValue(track, [{ isContainerHovered: isContainerHovered.value, direction: 'x' }]),
          trackClassName
        ]}
        domRef={xTrackRef}
      >
        <Div
          nodeName='ScrollDiv__x-thumb'
          className={[
            'absolute bottom-0 w-full',
            !noDefaultThumbTint &&
              shrinkToValue(thumb, [{ isContainerHovered: isContainerHovered.value, direction: 'x' }]),
            thumbClassName
          ]}
          domRef={xThumbRef}
          style={{
            width: xThumbWidth,
            left: `clamp(0px, var(--scroll-left, 0) * ${xThumbAvaliableScrollWidth} * 1px, ${xThumbAvaliableScrollWidth} * 1px)`
          }}
        />
      </Div>
    </Div>
  )
}
