import { flap, shrinkToValue } from '@edsolater/fnkit'
import { useCallbackRef, useRecordedEffect } from '@edsolater/hookit'
import { ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { onEvent } from '../../functions/dom/addEventListener'
import { mergeProps } from '../../functions/react'
import { ICSSObject } from '../../styles'
import { MayArray, MayFunction } from '../../typings/tools'
import { AddProps } from '../AddProps'
import { DivProps } from '../Div'

export * from './effects'
const TransitionPhaseProcessIn = 'during-process'
const TransitionPhaseShowing = 'shown' /* UI visiable and stable(not in transition) */
const TransitionPhaseHidden = 'hidden' /* UI invisiable */

export type TransitionPhase =
  | typeof TransitionPhaseProcessIn
  | typeof TransitionPhaseShowing
  | typeof TransitionPhaseHidden

export interface TransitionProps extends Omit<DivProps, 'children'> {
  cssTransitionDurationMs?: number
  cssTransitionTimingFunction?: ICSSObject['transitionTimingFunction']

  show?: boolean
  /** will trigger props:onBeforeEnter() if init props:show  */
  appear?: boolean

  enterFromProps?: DivProps
  duringEnterProps?: DivProps
  enterToProps?: DivProps

  leaveFromProps?: DivProps
  duringLeaveProps?: DivProps
  leaveToProps?: DivProps

  fromProps?: DivProps // shortcut for both enterFrom and leaveTo
  toProps?: DivProps // shortcut for both enterTo and leaveFrom

  onBeforeEnter?: (payload: {
    from: TransitionPhase
    to: TransitionPhase
    contentDivRef: RefObject<HTMLElement | undefined>
  }) => void
  onAfterEnter?: (payload: {
    from: TransitionPhase
    to: TransitionPhase
    contentDivRef: RefObject<HTMLElement | undefined>
  }) => void
  onBeforeLeave?: (payload: {
    from: TransitionPhase
    to: TransitionPhase
    contentDivRef: RefObject<HTMLElement | undefined>
  }) => void
  onAfterLeave?: (payload: {
    from: TransitionPhase
    to: TransitionPhase
    contentDivRef: RefObject<HTMLElement | undefined>
  }) => void

  presets?: MayArray<MayFunction<Omit<TransitionProps, 'presets'>>>
  children?: ReactNode | ((state: { phase: TransitionPhase }) => ReactNode)
}
type TransitionApplyPropsTimeName = 'enterFrom' | 'enterTo' | 'leaveFrom' | 'leaveTo'
type TransitionTargetPhase = typeof TransitionPhaseShowing | typeof TransitionPhaseHidden

//应该也有个useTransition的hooks
/** @headless it will render a <Fragment />, just add props in specific time */
export function Transition({
  cssTransitionDurationMs = 300,
  cssTransitionTimingFunction,

  show,
  appear,
  children,

  fromProps,
  toProps,

  enterFromProps = fromProps,
  enterToProps = toProps,
  duringEnterProps,

  leaveFromProps = toProps,
  leaveToProps = fromProps,
  duringLeaveProps,

  onBeforeEnter,
  onAfterEnter,
  onBeforeLeave,
  onAfterLeave,

  presets,

  ...orginalDivProps
}: TransitionProps) {
  const contentDivRef = useCallbackRef<HTMLElement>()
  const transitionPhaseProps = useMemo(() => {
    const baseTransitionICSS = {
      transition: `${cssTransitionDurationMs}ms`,
      transitionTimingFunction: cssTransitionTimingFunction
    }
    return {
      enterFrom: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.enterFromProps),
        duringEnterProps,
        enterFromProps,
        { icss: baseTransitionICSS } as DivProps
      ),
      enterTo: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.enterToProps),
        duringEnterProps,
        enterToProps,
        { icss: baseTransitionICSS } as DivProps
      ),
      leaveFrom: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.leaveFromProps),
        duringLeaveProps,
        leaveFromProps,
        { icss: baseTransitionICSS } as DivProps
      ),
      leaveTo: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.leaveToProps),
        duringLeaveProps,
        leaveToProps,
        { icss: baseTransitionICSS } as DivProps
      )
    } as Record<TransitionApplyPropsTimeName, DivProps>
  }, [enterFromProps, enterToProps, duringEnterProps, leaveFromProps, leaveToProps, duringLeaveProps])

  const [propsName, setPropsName] = useState<TransitionApplyPropsTimeName>(show && !appear ? 'enterTo' : 'enterFrom')
  const [currentPhase, setCurrentPhase] = useState<TransitionPhase>(show && !appear ? 'shown' : 'hidden')
  const [targetPhase, setTargetPhase] = useState<TransitionTargetPhase>(show ? 'shown' : 'hidden')

  const currentPhaseRef = useRef(currentPhase)
  currentPhaseRef.current = currentPhase

  const targetPhaseRef = useRef(targetPhase)
  targetPhaseRef.current = targetPhase

  // set data-** to element for semantic
  useEffect(() => {
    if (contentDivRef.current) {
      if (targetPhaseRef.current !== currentPhaseRef.current) {
        contentDivRef.current.dataset['to'] = targetPhase
      } else {
        contentDivRef.current.dataset['to'] = ''
      }
    }
  }, [contentDivRef])

  // this will let transition start
  useEffect(() => {
    setTargetPhase(show ? 'shown' : 'hidden')
  }, [show])

  // make inTransition during state sync with UI event
  useEffect(() => {
    contentDivRef.onChange(
      (dom) => {
        onEvent(
          dom,
          'transitionend',
          () => setCurrentPhase(targetPhaseRef.current),
          { targetSelf: true } // not event fired by bubbled
        )
        onEvent(
          dom,
          'transitionstart',
          () => setCurrentPhase('during-process'),
          { targetSelf: true } // not event fired by bubbled
        )
      },
      { hasInit: true }
    )
    // return () => {
    //   abortEndListener()
    //   abortStartListener()
    // }
  }, [contentDivRef])

  // invoke callbacks
  useRecordedEffect(
    ([prevCurrentPhase]) => {
      if (currentPhase === 'shown' && targetPhase === 'shown') {
        onAfterEnter?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }

      if (currentPhase === 'hidden' && targetPhase === 'hidden') {
        onAfterLeave?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }

      if (
        (currentPhase === 'hidden' || (currentPhase === 'during-process' && prevCurrentPhase === 'during-process')) &&
        targetPhase === 'shown'
      ) {
        onBeforeEnter?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }

      if (
        (currentPhase === 'shown' || (currentPhase === 'during-process' && prevCurrentPhase === 'during-process')) &&
        targetPhase === 'hidden'
      ) {
        onBeforeLeave?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }
    },
    [currentPhase, targetPhase]
  )

  // set props
  useEffect(() => {
    if (currentPhase === 'hidden' && targetPhase === 'shown') {
      setPropsName('enterFrom')
      setTimeout(() => {
        setPropsName('enterTo')
      })
    }
    if (currentPhase === 'during-process' && targetPhase === 'shown') {
      setPropsName('enterTo')
    }
    if (currentPhase === 'shown' && targetPhase === 'hidden') {
      setPropsName('leaveFrom')
      setTimeout(() => {
        setPropsName('leaveTo')
      })
    }
    if (currentPhase === 'during-process' && targetPhase === 'hidden') {
      setPropsName('leaveTo')
    }
  }, [currentPhase, targetPhase])
  const contentNode = shrinkToValue(children, [{ phase: currentPhase }])
  const isInnerShow = currentPhase === 'during-process' || currentPhase === 'shown' || targetPhase === 'shown'
  return isInnerShow ? (
    <AddProps {...mergeProps({ domRef: contentDivRef }, orginalDivProps, transitionPhaseProps[propsName])}>
      {contentNode}
    </AddProps>
  ) : null
}
