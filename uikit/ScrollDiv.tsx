import { ReactNode, useEffect, useRef } from 'react'
import { getCssVariable, setCssVarible } from '../functions/dom/cssVariable'
import { setDataSet } from '../functions/dom/dataset'
import { attachPointerMove, cancelPointerMove } from '../functions/dom/pointerMove'
import { useHover } from '../hooks/useHover'
import Div from './Div'
import {} from '@edsolater/fnkit'

// for high response of interaction, don't use React state
export default function ScrollDiv({ children }: { children?: ReactNode }) {
  const scrollOuterContainerRef = useRef<HTMLDivElement>()
  const scrollInnerContentRef = useRef<HTMLDivElement>()
  const scrollSlotRef = useRef<HTMLDivElement>()
  const scrollThumbRef = useRef<HTMLDivElement>()

  const isScrollThumbPressed = useRef(false)
  const isScrollContainerHover = useRef(false)
  const totalScrollOfInnerContent = useRef(0)
  const totalScrollOfScrollSlot = useRef(0)
  const scrollTop = useRef(0)

  useHover(scrollOuterContainerRef, {
    onHoverStart: () => {
      isScrollContainerHover.current = true
    },
    onHoverEnd: () => {
      isScrollContainerHover.current = false
    }
  })
  // add innerContent listener
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    scrollInnerContentRef.current.addEventListener(
      'scroll',
      (ev) => {
        if (isScrollThumbPressed.current) return 
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
        setDataSet(scrollThumbRef.current, 'isScrollThumbPressed', true)
        isScrollThumbPressed.current = true
      },
      end() {
        setDataSet(scrollThumbRef.current, 'isScrollThumbPressed', false)
        isScrollThumbPressed.current = false
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

  return (
    <Div domRef={scrollOuterContainerRef} className={['ScrollDiv w-full h-80 relative']}>
      <Div
        className={['ScrollDiv-scrollbar-slot absolute right-0 top-0 bottom-0 bg-block-semi-dark w-4']}
        domRef={scrollSlotRef}
      >
        <Div
          className={['ScrollDiv-scrollbar-thumb absolute right-0 h-8 bg-block-primary w-4']}
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
