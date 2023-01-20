import { flap, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, RefObject, useEffect, useMemo } from 'react'
import { DivProps } from '../../Div/type'
import { mergeProps } from '../../Div/utils/mergeProps'
import { useCallbackRef, useEvent, useRecordedEffect, useSignalState } from '../../hooks'
import { ICSSObject } from '../../styles'
import { MayArray, MayFunction } from '../../typings/tools'
import { onEvent } from '../../utils'
import { AddProps } from '../AddProps'

export * from './effects'
const TransitionPhaseProcessIn = 'during-process'
const TransitionPhaseShowing = 'shown' /* UI visiable and stable(not in transition) */
const TransitionPhaseHidden = 'hidden' /* UI invisiable */

export type TransitionPhase =
  | typeof TransitionPhaseProcessIn
  | typeof TransitionPhaseShowing
  | typeof TransitionPhaseHidden

  /**
   * it is used for open close 
   */
export interface TransitionProps extends Omit<DivProps, 'children'> {
  cssTransitionDurationMs?: number
  cssTransitionTimingFunction?: ICSSObject['transitionTimingFunction']

  // detect transition should be turn on
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
  const contentDivRef = useCallbackRef<HTMLElement | undefined>()
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
        { style: baseTransitionICSS } as DivProps
      ),
      enterTo: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.enterToProps),
        duringEnterProps,
        enterToProps,
        { style: baseTransitionICSS } as DivProps
      ),
      leaveFrom: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.leaveFromProps),
        duringLeaveProps,
        leaveFromProps,
        { style: baseTransitionICSS } as DivProps
      ),
      leaveTo: mergeProps(
        flap(presets).map((i) => shrinkToValue(i)?.leaveToProps),
        duringLeaveProps,
        leaveToProps,
        { style: baseTransitionICSS } as DivProps
      )
    } as Record<TransitionApplyPropsTimeName, DivProps>
  }, [enterFromProps, enterToProps, duringEnterProps, leaveFromProps, leaveToProps, duringLeaveProps])

  const [currentPhase, setCurrentPhase, currentPhaseSignal] = useSignalState<TransitionPhase>(
    show && !appear ? 'shown' : 'hidden'
  )
  const targetPhase: TransitionTargetPhase = show ? 'shown' : 'hidden'
  const targetPhaseSignal = useEvent(() => targetPhase)
  const isInnerShow = currentPhase === 'during-process' || currentPhase === 'shown' || targetPhase === 'shown'
  const propsName = useMemo<TransitionApplyPropsTimeName>(
    () =>
      targetPhase === 'shown'
        ? currentPhase === 'hidden'
          ? 'enterFrom'
          : 'enterTo'
        : currentPhase === 'shown'
        ? 'leaveFrom'
        : 'leaveTo',
    [currentPhase, targetPhase]
  )

  // set data-** to element for semantic
  useEffect(() => {
    if (contentDivRef.current) {
      if (targetPhaseSignal() !== currentPhaseSignal()) {
        contentDivRef.current.dataset['to'] = targetPhaseSignal()
      } else {
        contentDivRef.current.dataset['to'] = ''
      }
    }
  }, [contentDivRef])

  // make inTransition during state sync with UI event
  // const hasSetOnChangeCallback = useRef(false)
  useEffect(() => {
    // if (hasSetOnChangeCallback.current) return
    contentDivRef.onChange(
      (dom) => {
        onEvent(dom, 'transitionend', () => setCurrentPhase(targetPhaseSignal()), {
          onlyTargetIsSelf: true /* TODO - add feature: attach max one time  */
        }) // not event fired by bubbled
      },
      { hasInit: true }
    )
    // hasSetOnChangeCallback.current = true
  }, [contentDivRef])

  useEffect(() => {
    if (targetPhase !== currentPhase && currentPhase !== 'during-process') {
      setCurrentPhase('during-process')
    }
  }, [targetPhase])

  // invoke callbacks
  useRecordedEffect(
    ([prevCurrentPhase]) => {
      if (currentPhase === 'shown' && targetPhase === 'shown') {
        contentDivRef.current?.clientHeight // force GPU render frame
        onAfterEnter?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }

      if (currentPhase === 'hidden' && targetPhase === 'hidden') {
        contentDivRef.current?.clientHeight // force GPU render frame
        onAfterLeave?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }

      if (
        (currentPhase === 'hidden' || (currentPhase === 'during-process' && prevCurrentPhase === 'during-process')) &&
        targetPhase === 'shown'
      ) {
        contentDivRef.current?.clientHeight // force GPU render frame
        onBeforeEnter?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }

      if (
        (currentPhase === 'shown' || (currentPhase === 'during-process' && prevCurrentPhase === 'during-process')) &&
        targetPhase === 'hidden'
      ) {
        contentDivRef.current?.clientHeight // force GPU render frame
        onBeforeLeave?.({ from: currentPhase, to: targetPhase, contentDivRef })
      }
    },
    [currentPhase, targetPhase]
  )

  return isInnerShow ? (
    <AddProps {...mergeProps({ domRef: contentDivRef }, orginalDivProps, transitionPhaseProps[propsName])}>
      {shrinkToValue(children, [{ phase: currentPhase }])}
    </AddProps>
  ) : null
}
