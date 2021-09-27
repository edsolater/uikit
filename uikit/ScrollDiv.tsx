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

  noDefaultSlotTint?: boolean
  slotTint?: {}
}

type ScrollDivReturnedTintBlock = {
  slot:
    | string
    | ((status: {
        isThumbHovered: boolean
        isThumbActive: boolean
        isSlotHovered: boolean
        isContainerHovered: boolean
      }) => string)
  thumb:
    | string
    | ((status: {
        isThumbHovered: boolean
        isThumbActive: boolean
        isSlotHovered: boolean
        isContainerHovered: boolean
      }) => string)
}

const scrollDivTint = (
  thumbTintOptions: ScrollDivTintProps['thumbTint'] = {},
  slotTintOptions: ScrollDivTintProps['slotTint'] = {}
): ScrollDivReturnedTintBlock => {
  return {
    'slot': ({ isSlotHovered }) => `transition ${isSlotHovered ? 'w-4' : 'w-2'}`,
    'thumb': ({ isContainerHovered }) =>
      `h-8 transition active:bg-opacity-100 hover:bg-opacity-80  ${
        isContainerHovered ? 'bg-opacity-60' : 'bg-opacity-20'
      } bg-block-primary`
  }
}

interface ScrollDivProps extends DivProps, ScrollDivTintProps {
  children?: ReactNode
  className?: string
  slotClassName?: string
  thumbClassName?: string
}
// for high response of interaction, don't use React state
export default function ScrollDiv({
  children,
  className,
  slotClassName,
  thumbClassName,
  thumbTint: thumbTintOptions,
  noDefaultThumbTint,
  slotTint: slotTintOptions,
  noDefaultSlotTint
}: ScrollDivProps) {
  const scrollOuterContainerRef = useRef<HTMLDivElement>()
  const scrollInnerContentRef = useRef<HTMLDivElement>()
  const scrollSlotRef = useRef<HTMLDivElement>()
  const scrollThumbRef = useRef<HTMLDivElement>()

  const isScrollThumbActive = useBFlag(false)
  const isScrollThumbHovered = useBFlag(false)
  const isScrollContainerHovered = useBFlag(false)
  const isScrollSlotHovered = useBFlag(false)

  const totalScrollOfInnerContent = useRef(0)
  const totalScrollOfScrollSlot = useRef(0)
  const scrollTop = useRef(0)

  useHover(scrollOuterContainerRef, {
    onHover({ is }) {
      isScrollContainerHovered.set(is === 'start')
    }
  })
  useHover(scrollThumbRef, {
    onHover({ is }) {
      isScrollThumbHovered.set(is === 'start')
    }
  })
  useHover(scrollSlotRef, {
    onHover({ is }) {
      isScrollSlotHovered.set(is === 'start')
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
        if (!scrollOuterContainerRef.current || !scrollInnerContentRef.current) return
        const contentEl = ev.target as HTMLDivElement
        const avaliableScroll = Number(getCssVariable(scrollInnerContentRef.current, 'totalScroll') || '0')
        const currentScrollTop = contentEl.scrollTop / avaliableScroll
        setCssVarible(scrollOuterContainerRef.current, 'scrollTop', currentScrollTop)
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
        const avaliableScroll = Number(getCssVariable(scrollSlotRef.current, 'totalScroll') || '0')
        setCssVarible(scrollOuterContainerRef.current, 'scrollTop', (prev) => {
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
    setCssVarible(scrollInnerContentRef.current, 'totalScroll', String(totalScroll))
    totalScrollOfInnerContent.current = totalScroll
  }, [])

  // add --total-scroll as soon as scrollbar is available
  useEffect(() => {
    if (!scrollSlotRef.current || !scrollThumbRef.current) return
    const totalScroll = scrollSlotRef.current.clientHeight - scrollThumbRef.current.clientHeight
    setCssVarible(scrollSlotRef.current, 'totalScroll', String(totalScroll))
    totalScrollOfScrollSlot.current = totalScroll
  }, [])

  const { slot, thumb } = scrollDivTint(thumbTintOptions, slotTintOptions)
  return (
    <Div domRef={scrollOuterContainerRef} className={['ScrollDiv w-full h-80 relative', className]}>
      <Div
        className={[
          'ScrollDiv-scrollbar-slot absolute right-0 top-0 bottom-0',
          !noDefaultSlotTint &&
            shrinkToValue(slot, [
              {
                isContainerHovered: isScrollContainerHovered.value,
                isSlotHovered: isScrollSlotHovered.value,
                isThumbHovered: isScrollThumbHovered.value,
                isThumbActive: isScrollThumbActive.value
              }
            ]),
          slotClassName
        ]}
        domRef={scrollSlotRef}
      >
        <Div
          className={[
            'ScrollDiv-scrollbar-thumb absolute right-0 w-full',
            !noDefaultThumbTint &&
              shrinkToValue(thumb, [
                {
                  isContainerHovered: isScrollContainerHovered.value,
                  isSlotHovered: isScrollSlotHovered.value,
                  isThumbHovered: isScrollThumbHovered.value,
                  isThumbActive: isScrollThumbActive.value
                }
              ]),
            thumbClassName
          ]}
          domRef={scrollThumbRef}
          style={{
            top: 'clamp(0px, var(--scroll-top, 0) * var(--total-scroll, 0) * 1px, var(--total-scroll, 0) * 1px)'
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
