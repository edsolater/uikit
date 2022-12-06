import { ReactNode, useRef } from 'react'

import { useInitFlagDetector } from '@edsolater/hookit'
import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'
import { CSSStyle, cssTransitionTimeFnOutQuadratic } from '../styles'
import { opacityInOut } from './Transition/effects'
import { Transition, TransitionProps } from './Transition/Transition'

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

/** @deprecated just use `<Div>`'s prop motion */
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
  const innerChildren = useRef<ReactNode>(children)
  if (children) innerChildren.current = children // cache for close transition

  const haveInitTransition = show && appear
  const innerStyle = useRef([
    // cache for not change in rerender
    baseTransitionStyle,
    show && !appear ? undefined : { position: 'absolute', opacity: '0' }
  ] as DivProps['style'])
  const handleFadeInCSS = useFadeInPaddingEffect({ heightOrWidth })
  return (
    <Transition
      show={Boolean(show)}
      appear={appear}
      cssTransitionDurationMs={duration}
      cssTransitionTimingFunction={transitionTimeFuncing}
      presets={transitionPresets}
      style={innerStyle.current}
      onBeforeEnter={({ contentDivRef: contentRef, from }) => {
        if (!contentRef.current) return

        contentRef.current.style.removeProperty('position')
        contentRef.current.style.removeProperty('opacity')
        if (ignoreEnterTransition) return
        if (from === 'during-process') {
          handleFadeInCSS.toOriginal(contentRef.current)
        } else {
          contentRef.current.style.setProperty('transition-property', 'none') // if element self has width(224px for example), it will have no effect to set width 0 then set with 224px
          handleFadeInCSS.toZero(contentRef.current, { recordValue: true })
          contentRef.current.clientHeight // force GPU to reflow this frame
          contentRef.current.style.removeProperty('transition-property')
          handleFadeInCSS.toOriginal(contentRef.current)
        }
      }}
      onAfterEnter={({ contentDivRef: contentRef }) => {
        if (!contentRef.current) return

        if (init && !haveInitTransition) {
          contentRef.current.style.removeProperty('position')
          contentRef.current.style.removeProperty('opacity')
        }
        handleFadeInCSS.clearProperty(contentRef.current)
        onAfterEnter?.()
      }}
      onBeforeLeave={({ contentDivRef: contentRef, from }) => {
        if (!contentRef.current) return

        if (ignoreLeaveTransition) return
        if (from === 'during-process') {
          handleFadeInCSS.toZero(contentRef.current)
        } else {
          handleFadeInCSS.toOriginal(contentRef.current, { recordValue: true })
          contentRef.current.clientHeight
          handleFadeInCSS.toZero(contentRef.current)
        }
      }}
      onAfterLeave={({ contentDivRef: contentRef }) => {
        if (!contentRef.current) return
        handleFadeInCSS.clearProperty(contentRef.current)
        contentRef.current.style.setProperty('position', 'absolute')
        contentRef.current.style.setProperty('opacity', '0')
        innerStyle.current = [baseTransitionStyle, { position: 'absolute', opacity: '0' }] as DivProps['style']
        onAfterLeave?.()
      }}
    >
      {hasWrapper ? <Div {...propsOfWrapper}>{innerChildren.current}</Div> : innerChildren.current}
    </Transition>
  )
}

function useFadeInPaddingEffect({ heightOrWidth }: { heightOrWidth: 'height' | 'width' }) {
  const contentCachedTrueHeightOrWidth = useRef<number>()
  const contentCachedTruePadding = useRef<string>()
  return {
    toZero: (el: HTMLElement, options?: { recordValue?: boolean }) => {
      if (options?.recordValue) {
        contentCachedTrueHeightOrWidth.current = el[heightOrWidth === 'height' ? 'clientHeight' : 'clientWidth'] // cache for from 'during-process' fade in can't get true height
        // cache for from 'during-process' fade in can't get true padding
        contentCachedTruePadding.current = getComputedStyle(el).padding
      }
      el.style.setProperty(heightOrWidth, '0')
      el.style.setProperty('padding', '0')
    },
    toOriginal: (el: HTMLElement, options?: { recordValue?: boolean }) => {
      if (options?.recordValue) {
        contentCachedTrueHeightOrWidth.current = el[heightOrWidth === 'height' ? 'clientHeight' : 'clientWidth'] // cache for from 'during-process' fade in can't get true height
        // cache for from 'during-process' fade in can't get true padding
        contentCachedTruePadding.current = getComputedStyle(el).padding
      }
      contentCachedTrueHeightOrWidth.current &&
        el.style.setProperty(heightOrWidth, `${contentCachedTrueHeightOrWidth.current}px`)
      contentCachedTruePadding.current && el.style.setProperty('padding', contentCachedTruePadding.current)
    },
    clearProperty: (el: HTMLElement) => {
      el.style.removeProperty(heightOrWidth)
      el.style.removeProperty('padding')
    }
  }
}
