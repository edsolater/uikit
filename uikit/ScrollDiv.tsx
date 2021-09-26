import { ReactNode, useEffect, useRef } from 'react'
import { getCssVariable, setCssVarible } from '../functions/dom/cssVariable'
import { setDataSet } from '../functions/dom/dataset'
import { attachPointerMove, cancelPointerMove } from '../functions/dom/pointerMove'
import Div from './Div'

export default function ScrollDiv({ children }: { children?: ReactNode }) {
  const scrollInnerContentRef = useRef<HTMLDivElement>()
  const scrollOuterContainerRef = useRef<HTMLDivElement>()
  const scrollSlotRef = useRef<HTMLDivElement>()
  const scrollThumbRef = useRef<HTMLDivElement>()

  const isScrollThumbPressed = useRef(false)

  // add innerContent listener
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    scrollInnerContentRef.current.addEventListener(
      'scroll',
      (ev) => {
        if (!scrollOuterContainerRef.current || !scrollInnerContentRef.current) return
        const contentEl = ev.target as HTMLDivElement
        const avaliableScroll = Number(getCssVariable(scrollInnerContentRef.current, 'totalScroll') || '0')
        setCssVarible(scrollInnerContentRef.current, 'scrollTop', contentEl.scrollTop / avaliableScroll)
      },
      { passive: true }
    )
  }, [])

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
        setCssVarible(
          scrollOuterContainerRef.current,
          'scrollTop',
          (prev) => Number(prev) + currentDeltaInPx.dy / avaliableScroll
        )
      }
    })
    return () => cancelPointerMove(eventId)
  }, [])

  // add --total-scroll as soon as innerContent is available
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    setCssVarible(
      scrollInnerContentRef.current,
      'totalScroll',
      String(scrollInnerContentRef.current.scrollHeight - scrollInnerContentRef.current.clientHeight)
    )
  }, [])

  // add --total-scroll as soon as scrollbar is available
  useEffect(() => {
    if (!scrollSlotRef.current || !scrollThumbRef.current) return
    setCssVarible(
      scrollSlotRef.current,
      'totalScroll',
      String(scrollSlotRef.current.clientHeight - scrollThumbRef.current.clientHeight)
    )
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
