import { useEffect, useRef } from 'react'
import { setCSSVariable } from '../../utils'
import { handleScroll } from '../../utils/dom/gesture/handleScroll'
import { createPlugin } from '../createPlugin'

export const scrollDetecterCSSVariableNames = {
  '--dx': '--dx', // number
  '--dy': '--dy', // number
  '--speed-x': '--speed-x', // delta x / millisecond
  '--speed-y': '--speed-y' // delta x / millisecond
} as const

export type ScrollDetectorPluginOption = {
  detectTargetDOM?: HTMLElement // default is self dom
}

export const scrollDetecter = Object.assign(
  createPlugin<ScrollDetectorPluginOption>(({ detectTargetDOM }) => {
    const self = useRef<HTMLElement>()
    useEffect(() => {
      if (!self.current) return
      handleScroll(self.current, {
        onScroll({ deltaY, el , deltaX}) {
          const to = detectTargetDOM ?? el
          setCSSVariable(to, scrollDetecterCSSVariableNames['--dy'], deltaY)
          setCSSVariable(to, scrollDetecterCSSVariableNames['--dx'], deltaX)
        }
      })
    }, [self])
    return { domRef: self }
  }),
  { cssVariable: scrollDetecterCSSVariableNames }
)
