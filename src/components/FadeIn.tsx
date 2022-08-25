import { ReactNode, useRef } from 'react'

import { CSSStyle, cssTransitionTimeFnOutQuadratic } from '../styles'
import { Div } from './Div/Div'
import { DivProps } from "./Div/type"
import { TransitionProps, Transition } from './Transition/Transition'
import { opacityInOut } from './Transition/effects'
import { useInitFlagDetector } from '@edsolater/hookit'

type FadeInProps = {
  heightOrWidth?: 'height' | 'width'
  propsOfWrapper?: DivProps
  hasWrapper?: boolean
  show?: boolean
  duration?: number
  transitionTimeFuncing?: string
  /** advanced settings */
  transitionPresets?: TransitionProps['presets']
  ignoreEnterTransition?: boolean
  ignoreLeaveTransition?: boolean
  children?: ReactNode // if immediately, inner content maybe be still not render ready
  onAfterEnter?: () => void
  onAfterLeave?: () => void
} & TransitionProps

const baseTransitionStyle = { overflow: 'hidden' } as CSSStyle

/** trans width/height from zero to auto */
export function FadeIn({
  children,
  heightOrWidth = 'height',
  propsOfWrapper,
  hasWrapper = Boolean(propsOfWrapper),
  show = Boolean(children),
  appear,
  duration = 300,
  transitionTimeFuncing = cssTransitionTimeFnOutQuadratic,
  transitionPresets = [opacityInOut({ min: 0.3 })],
  ignoreEnterTransition,
  ignoreLeaveTransition,
  onAfterEnter,
  onAfterLeave
}: FadeInProps) {
  const init = useInitFlagDetector()

  const contentCachedTrueHeightOrWidth = useRef<number>()
  const innerChildren = useRef<ReactNode>(children)
  if (children) innerChildren.current = children // cache for close transition

  const haveInitTransition = show && appear
  const innerStyle = useRef([
    // cache for not change in rerender
    baseTransitionStyle,
    show && !appear ? undefined : { position: 'absolute', opacity: '0' }
  ] as DivProps['style'])
  return (
    <Transition
      show={Boolean(show)}
      appear={appear}
      cssTransitionDurationMs={duration}
      cssTransitionTimingFunction={transitionTimeFuncing}
      presets={transitionPresets}
      style={innerStyle.current}
      onBeforeEnter={({ contentDivRef: contentRef, from }) => {
        contentRef.current?.style.removeProperty('position')
        contentRef.current?.style.removeProperty('opacity')
        if (ignoreEnterTransition) return
        if (from === 'during-process') {
          contentRef.current?.style.setProperty(heightOrWidth, `${contentCachedTrueHeightOrWidth.current}px`)
        } else {
          contentRef.current?.style.setProperty('transition-property', 'none') // if element self has width(224px for example), it will have no effect to set width 0 then set with 224px
          contentCachedTrueHeightOrWidth.current =
            contentRef.current?.[heightOrWidth === 'height' ? 'clientHeight' : 'clientWidth']
          // TODO: should also transition margin-inline and padding-inline
          contentRef.current?.style.setProperty(heightOrWidth, '0')
          contentRef.current?.clientHeight // force GPU to reflow this frame
          contentRef.current?.style.removeProperty('transition-property')
          contentRef.current?.style.setProperty(heightOrWidth, `${contentCachedTrueHeightOrWidth.current}px`)
        }
      }}
      onAfterEnter={({ contentDivRef: contentRef }) => {
        if (init && !haveInitTransition) {
          contentRef.current?.style.removeProperty('position')
          contentRef.current?.style.removeProperty('opacity')
        }
        contentRef.current?.style.removeProperty(heightOrWidth)
        onAfterEnter?.()
      }}
      onBeforeLeave={({ contentDivRef: contentRef, from }) => {
        if (ignoreLeaveTransition) return
        if (from === 'during-process') {
          contentRef.current?.style.setProperty(heightOrWidth, '0')
        } else {
          contentCachedTrueHeightOrWidth.current =
            contentRef.current?.[heightOrWidth === 'height' ? 'clientHeight' : 'clientWidth']
          contentRef.current?.style.setProperty(heightOrWidth, `${contentCachedTrueHeightOrWidth.current}px`)
          contentRef.current?.clientHeight
          contentRef.current?.style.setProperty(heightOrWidth, '0')
        }
      }}
      onAfterLeave={({ contentDivRef: contentRef }) => {
        contentRef.current?.style.removeProperty(heightOrWidth)
        contentRef.current?.style.setProperty('position', 'absolute')
        contentRef.current?.style.setProperty('opacity', '0')
        innerStyle.current = [baseTransitionStyle, { position: 'absolute', opacity: '0' }] as DivProps['style']
        onAfterLeave?.()
      }}
    >
      {hasWrapper ? <Div {...propsOfWrapper}>{innerChildren.current}</Div> : innerChildren.current}
    </Transition>
  )
}
