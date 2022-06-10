import { useImperativeHandle, useRef } from 'react'
import { setCSSVariable, setInlineStyle } from '../functions/dom/setCSS'
import { useIsomorphicLayoutEffect } from '../hooks'
import { createICSS } from '../styles'
import Div, { DivProps } from './Div'

export interface ScrollBoxProps extends DivProps {
  /** space between scrollbar and content  */
  scrollbarPlacementHint?: 'right' | 'bottom'
}

// `<ScrollBox>`'s feature hook
function useScrollbarGapSpace(scrollbarPlacementHint?: 'right' | 'bottom') {
  const scrollBoxRef = useRef<HTMLElement>()
  useIsomorphicLayoutEffect(() => {
    if (!scrollBoxRef.current) return console.error('scrollBoxRef is not ready')
    const isYOverflow = scrollBoxRef.current.scrollHeight > scrollBoxRef.current.clientHeight
    const isXOverflow = scrollBoxRef.current.scrollWidth > scrollBoxRef.current.clientWidth
    if (isYOverflow) setInlineStyle(scrollBoxRef.current, { marginRight: -6, paddingRight: 6 })
    if (isXOverflow) setInlineStyle(scrollBoxRef.current, { marginBottom: -6, paddingBottom: 6 })
  }, [])
  const icss = createICSS(
    { transition: '200ms' },
    scrollbarPlacementHint === 'right'
      ? { marginRight: -6, paddingRight: 6 }
      : scrollbarPlacementHint === 'bottom'
      ? { marginBottom: -6, paddingBottom: 6 }
      : undefined
  )
  return { icss, ref: scrollBoxRef }
}

export default function ScrollBox({ scrollbarPlacementHint, ...props }: ScrollBoxProps) {
  const { icss: scrollbarGapICSS, ref: scrollbarGapRef } = useScrollbarGapSpace(scrollbarPlacementHint)
  return (
    <Div
      {...props}
      domRef_={scrollbarGapRef}
      className_='ScrollBox'
      icss_={[{ overflow: 'auto', height: '100%' }, scrollbarGapICSS]}
    />
  )
}
