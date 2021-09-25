import { ReactNode, useEffect, useRef } from 'react'
import Div from './Div'

export default function ScrollDiv({ children }: { children?: ReactNode }) {
  const scrollInnerContentRef = useRef<HTMLDivElement>()
  const scrollOuterContainerRef = useRef<HTMLDivElement>()
  const scrollSlotRef = useRef<HTMLDivElement>()
  const scrollThumbRef = useRef<HTMLDivElement>()

  // add innerContent listener
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    scrollInnerContentRef.current.addEventListener(
      'scroll',
      (ev) => {
        if (!scrollOuterContainerRef.current || !scrollInnerContentRef.current) return
        const contentEl = ev.target as HTMLDivElement
        const avaliableScroll = Number(scrollInnerContentRef.current.style.getPropertyValue('--total-scroll') || '0')
        scrollOuterContainerRef.current.style.setProperty('--scroll-top', String(contentEl.scrollTop / avaliableScroll))
      },
      { passive: true }
    )
  }, [])

  // add --total-scroll as soon as innerContent is available
  useEffect(() => {
    if (!scrollInnerContentRef.current) return
    scrollInnerContentRef.current.style.setProperty(
      '--total-scroll',
      String(scrollInnerContentRef.current.scrollHeight - scrollInnerContentRef.current.clientHeight)
    )
  }, [])

  // add --total-scroll as soon as scrollbar is available
  useEffect(() => {
    if (!scrollSlotRef.current || !scrollThumbRef.current) return
    scrollSlotRef.current.style.setProperty(
      '--total-scroll',
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
            top: 'calc(var(--scroll-top, 0) * var(--total-scroll, 0) * 1px)'
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
