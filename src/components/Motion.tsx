import { useLayoutEffect, useRef } from 'react'
import { DivChildNode, DivProps } from '../Div/type'
import { AddProps } from './AddProps'
import { createKit } from './utils'

export interface MotionProps extends DivProps {
  animateOptions?: KeyframeEffectOptions
}

export const Motion = createKit(
  {
    name: 'Motion',
    defaultProps: {
      animateOptions: {
        duration: 300,
        iterations: 1,
        easing: 'ease'
      }
    }
  },
  ({ children, animateOptions = { duration: 300, iterations: 1, easing: 'ease' } }: MotionProps) => {
    const squareRef = useRef<HTMLElement>()
    const fromRectPositon = useRef<DOMRect>()
    const fromRectSize = useRef<DOMRect>()

    // position change
    useLayoutEffect(() => {
      // so css change must cause rerender by React, so useLayoutEffect can do something before change attach to DOM
      if (!squareRef.current) return
      const toRect = squareRef.current.getBoundingClientRect()
      let animationControl: Animation | undefined
      if (fromRectPositon.current && toRect && hasPositionChanged(fromRectPositon.current, toRect)) {
        const deltaX = toRect.x - fromRectPositon.current.x
        const deltaY = toRect.y - fromRectPositon.current.y
        animationControl = squareRef.current.animate(
          [{ transform: `translate(${-deltaX}px, ${-deltaY}px)` }, { transform: '', offset: 1 }],
          animateOptions // iteration 1 can use to moke transition
        )
      }

      return () => {
        if (!animationControl || animationControl.playState === 'finished') {
          // record for next frame
          fromRectPositon.current = toRect
        } else {
          // record for next frame
          fromRectPositon.current = squareRef.current?.getBoundingClientRect()
          animationControl?.cancel()
        }
      }
    })

    // size change
    useLayoutEffect(() => {
      // so css change must cause rerender by React, so useLayoutEffect can do something before change attach to DOM
      if (!squareRef.current) return
      const toRect = squareRef.current.getBoundingClientRect()
      let animationControl: Animation | undefined
      if (fromRectSize.current && toRect && hasSizeChanged(fromRectSize.current, toRect)) {
        animationControl = squareRef.current.animate(
          [
            { width: fromRectSize.current?.width + 'px', height: fromRectSize.current?.height + 'px' },
            { width: toRect.width + 'px', height: toRect.height + 'px', offset: 1 }
          ],
          animateOptions // iteration 1 can use to moke transition
        )
      }

      return () => {
        if (!animationControl || animationControl.playState === 'finished') {
          // record for next frame
          fromRectSize.current = toRect
        } else {
          // record for next frame
          fromRectSize.current = squareRef.current?.getBoundingClientRect()
          animationControl?.cancel()
        }
      }
    })

    // appear
    useLayoutEffect(() => {
      // so css change must cause rerender by React, so useLayoutEffect can do something before change attach to DOM
      if (!squareRef.current) return
      const animationControl = squareRef.current.animate(
        [{ transform: 'scale(0)' }, { transform: '', offset: 1 }],
        { duration: 200, iterations: 1, easing: 'ease' } // iteration 1 can use to moke transition
      )
      return () => animationControl.cancel()
    }, [])

    return <AddProps domRef={squareRef}>{children}</AddProps>
  }
)

const hasSizeChanged = (from: DOMRect, to: DOMRect) => from.width !== to.width || from.height !== to.height
const hasPositionChanged = (from: DOMRect, to: DOMRect) => from.x !== to.x || from.y !== to.y
