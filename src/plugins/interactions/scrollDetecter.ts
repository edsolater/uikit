import { useEffect, useRef } from 'react'
import { setCSSVariable } from '../../utils'
import { handleScroll } from '../../utils/dom/gesture/handleScroll'
import { createPlugin } from '../createPlugin'

export const scrollDetecterCSSVariableNames = {
  '--dx': '--dx', // number
  '--dy': '--dy', // number
  '--speed-x': '--speed-x', // delta x / millisecond
  '--speed-y': '--speed-y', // delta y / millisecond
  '--dy-in-100ms': '--dy-in-100ms', // number
  '--dy-in-500ms': '--dy-in-500ms', // number
  '--speed-y-in-100ms': '--speed-y-in-100ms', // delta y / millisecond
  '--speed-y-in-500ms': '--speed-y-in-500ms' // delta y / millisecond
} as const

export type ScrollDetectorPluginOption = {
  detectTargetDOM?: HTMLElement // default is self dom
}

export const scrollDetecter = Object.assign(
  createPlugin<ScrollDetectorPluginOption>(({ detectTargetDOM }) => {
    const self = useRef<HTMLElement>()
    useEffect(() => {
      if (!self.current) return
      const subscription = handleScroll(self.current, {
        onScroll({ deltaY, el, deltaX, speedX, speedY, deltaYIn, speedYIn }) {
          const to = detectTargetDOM ?? el
          setCSSVariable(to, scrollDetecterCSSVariableNames['--dy'], deltaY)
          setCSSVariable(to, scrollDetecterCSSVariableNames['--dx'], deltaX)
          setCSSVariable(to, scrollDetecterCSSVariableNames['--speed-x'], speedX)
          setCSSVariable(to, scrollDetecterCSSVariableNames['--speed-y'], speedY)
          setCSSVariable(to, scrollDetecterCSSVariableNames['--dy-in-100ms'], deltaYIn(100))
          setCSSVariable(to, scrollDetecterCSSVariableNames['--dy-in-500ms'], deltaYIn(500))
          setCSSVariable(to, scrollDetecterCSSVariableNames['--speed-y-in-100ms'], speedYIn(100))
          setCSSVariable(to, scrollDetecterCSSVariableNames['--speed-y-in-500ms'], speedYIn(500))
        }
      })
      return subscription.abort
    }, [self, detectTargetDOM])
    return { domRef: self }
  }),
  { cssVariable: scrollDetecterCSSVariableNames }
)

// TODO
// type scrollDetecterStatus = {
  
// }

// export function useScrollDetector(id: string){
//   return scrollDetecterStatus
// }