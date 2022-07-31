import { ReactNode, useRef } from 'react'

import { cssTransitionTimeFnOutQuadratic } from '../styles'
import { Div } from './Div'
import { TransitionProps, Transition } from './Transition/Transition'
import { opacityInOut } from './Transition/effects'

export function FadeIn({
  children,
  heightOrWidth = 'height',
  show = Boolean(children),
  duration = 400,
  transitionTimeFuncing = cssTransitionTimeFnOutQuadratic,
  transitionPresets = [opacityInOut({ min: 0.3 })],
  ignoreEnterTransition,
  ignoreLeaveTransition
}: {
  heightOrWidth?: 'height' | 'width'
  show?: boolean
  duration?: number
  transitionTimeFuncing?: string
  /** advanced settings */
  transitionPresets?: TransitionProps['presets']

  ignoreEnterTransition?: boolean
  ignoreLeaveTransition?: boolean
  children?: ReactNode // if immediately, inner content maybe be still not render ready
}) {
  const contentTrueHeightOrWidth = useRef<number>()

  return (
    <Transition
      show={Boolean(show)}
      cssTransitionDurationMs={duration}
      cssTransitionTimingFunction={transitionTimeFuncing}
      presets={transitionPresets}
      style={{ overflow: 'hidden' }}
      onBeforeEnter={({ contentDivRef: contentRef, from }) => {
        if (ignoreEnterTransition) return
        if (from === 'during-process') {
          contentRef.current?.style.setProperty(heightOrWidth, `${contentTrueHeightOrWidth.current}px`)
        } else {
          contentTrueHeightOrWidth.current = contentRef.current?.clientHeight
          contentRef.current?.style.setProperty(heightOrWidth, '0')
          contentRef.current?.clientHeight
          contentRef.current?.style.setProperty(heightOrWidth, `${contentTrueHeightOrWidth.current}px`)
        }
      }}
      onAfterEnter={({ contentDivRef: contentRef }) => {
        contentRef.current?.style.removeProperty(heightOrWidth)
      }}
      onBeforeLeave={({ contentDivRef: contentRef, from }) => {
        if (ignoreLeaveTransition) return

        if (from === 'during-process') {
          contentRef.current?.style.setProperty(heightOrWidth, '0')
        } else {
          contentTrueHeightOrWidth.current = contentRef.current?.clientHeight
          contentRef.current?.style.setProperty(heightOrWidth, `${contentTrueHeightOrWidth.current}px`)
          contentRef.current?.clientHeight
          contentRef.current?.style.setProperty(heightOrWidth, '0')
        }
      }}
      onAfterLeave={({ contentDivRef: contentRef }) => {
        contentRef.current?.style.removeProperty(heightOrWidth)
      }}
    >
      {/* <FadeIn> must have o always exist Div to isolate children's css style  */}
      <Div>{children}</Div>
    </Transition>
  )
}
