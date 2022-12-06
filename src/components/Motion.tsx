import { useLayoutEffect, useRef } from 'react'
import { DivChildNode } from '../Div/type'
import { AddProps } from './AddProps'
import { uikit } from './utils'

export interface MotionProps {
  children?: DivChildNode
}

export const Motion = uikit('Motion', ({ children }: MotionProps) => {
  const squareRef = useRef<HTMLElement>()
  const initialPositionRef = useRef<{ x: number; y: number }>()

  useLayoutEffect(() => {
    if (!squareRef.current) return
    const box = squareRef.current.getBoundingClientRect()

    if (initialPositionRef.current && box && moved(initialPositionRef.current, box)) {
      // get the difference in position
      const deltaX = box.x - initialPositionRef.current.x
      // animate back to the final position
      squareRef.current.animate(
        [{ transform: `translate(${-deltaX}px)` }, { transform: `translate(0px)`, offset: 1 }],
        { duration: 300, iterations: 1, fill: 'both' } // iteration
      )
    }

    initialPositionRef.current = box
  })

  return <AddProps domRef={squareRef}>{children}</AddProps>
})

const moved = (initialBox: { x: number; y: number } | undefined, finalBox: { x: number; y: number } | undefined) => {
  // we just mounted, so we don't have complete data yet
  if (!initialBox || !finalBox) return false
  const xMoved = initialBox.x !== finalBox.x
  const yMoved = initialBox.y !== finalBox.y
  return xMoved || yMoved
}
