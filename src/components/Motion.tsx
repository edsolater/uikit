import { useLayoutEffect, useRef } from 'react'
import { DivChildNode } from '../Div/type'
import { AddProps } from './AddProps'
import { uikit } from './utils'

export interface MotionProps {
  children?: DivChildNode
}

function calcDeltaTrasformCSS(from: DOMRect, to: DOMRect) {
  // get the difference in position
  const deltaX = to.x - from.x
  return `translate(${-deltaX}px)`
}

export const Motion = uikit('Motion', ({ children }: MotionProps) => {
  const squareRef = useRef<HTMLElement>()
  const fromRect = useRef<DOMRect>()
  useLayoutEffect(() => {
    // so css change must cause rerender by React, so useLayoutEffect can do something before change attach to DOM
    if (!squareRef.current) return

    const toRect = squareRef.current.getBoundingClientRect()

    let animationControl: Animation | undefined
    if (fromRect.current && toRect && hasRectChanged(fromRect.current, toRect)) {
      animationControl = squareRef.current.animate(
        [{ transform: calcDeltaTrasformCSS(fromRect.current, toRect) }, { transform: '', offset: 1 }],
        { duration: 300, iterations: 1, easing: 'ease' } // iteration 1 can use to moke transition
      )
    }

    return () => {
      if (animationControl?.playState === 'finished') {
        // record for next frame
        fromRect.current = toRect
      } else {
        // record for next frame
        fromRect.current = squareRef.current?.getBoundingClientRect()
        animationControl?.cancel()
      }
    }
  })

  return <AddProps domRef={squareRef}>{children}</AddProps>
})
const hasRectChanged = (
  initialBox: { x: number; y: number } | undefined,
  finalBox: { x: number; y: number } | undefined
) => {
  // we just mounted, so we don't have complete data yet
  if (!initialBox || !finalBox) return false
  const xMoved = initialBox.x !== finalBox.x
  const yMoved = initialBox.y !== finalBox.y
  return xMoved || yMoved
}
