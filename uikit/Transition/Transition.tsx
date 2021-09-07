import type { ReactNode } from 'react'
import type { DivProps } from '../Div'
import { useEffect, useRef } from 'react'
import Div from '../Div'
import useToggle from '../../hooks/useToggle'
import usePromisedState from '../../hooks/usePromisedState'
import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'
import { TransitionEffectLabel, transitionEffects } from './transitionEffect'
import { transitionEffectLabels } from './transitionEffect'
import type { MayArray, Valueof } from '../../typings/tools'

export type TransitionPhase = 'enter' | 'leave' | 'showing' | 'hidden'

export interface TransitionProps extends DivProps {
  show: boolean
  effect?: MayArray<TransitionEffectLabel>
  children?:
    | ReactNode
    | ((state: { phase: TransitionPhase; duringTransition: boolean }) => ReactNode)
}

function pickValues<T extends Record<string, any>>(obj: T, keys: MayArray<keyof T>): Valueof<T>[] {
  // @ts-expect-error don't know why it's error, but it should be true
  return [keys].flat().map((k) => obj[k])
}
//应该也有个useTransition的hooks
/** @headless it will render a <Fragment /> */
export default function Transition({
  show,
  children,
  effect = transitionEffectLabels[0]
}: TransitionProps) {
  const [duringTransition, inTransitionController] = useToggle()
  const transitionEffect = pickValues(transitionEffects, effect) // TODO currently, there is no type.
  const enterFromClassName = transitionEffect.map((ef) => `${ef.enter} ${ef.enterFrom}`).join(' ')
  const enterToClassName = transitionEffect.map((ef) => `${ef.enter} ${ef.enterTo}`).join(' ')
  const leaveFromClassName = transitionEffect.map((ef) => `${ef.leave} ${ef.leaveFrom}`).join('  ') // 2 space for different from `${enter} ${enterTo}`
  const leaveToClassName = transitionEffect.map((ef) => `${ef.leave} ${ef.leaveTo}`).join('  ')
  const [inDomTree, inDomController] = useToggle(show) // this will equal to show, when it's not transition.
  const [currentClassName, setcurrentClassName] = usePromisedState<string>()
  const ref = useRef<HTMLDivElement>()
  const currentPhase: TransitionPhase =
    show && !duringTransition
      ? 'showing'
      : show && duringTransition
      ? 'enter'
      : !show && duringTransition
      ? 'leave'
      : 'hidden'

  useEffect(() => {
    if (ref.current) ref.current.dataset['phase'] = currentPhase
  }, [currentPhase])

  useEffect(() => {
    if (show && !inDomTree) {
      inDomController.on()
      inTransitionController.on()
      setcurrentClassName(enterFromClassName).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(enterToClassName)
          ref.current?.addEventListener('transitionend', () => inTransitionController.off(), {
            once: true
          })
        }, 0)
      })
    }
  }, [show])

  useEffect(() => {
    if (!show && inDomTree) {
      inTransitionController.on()
      setcurrentClassName(leaveFromClassName).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(leaveToClassName)
          ref.current?.addEventListener('transitionend', inTransitionController.off, { once: true })
          ref.current?.addEventListener('transitionend', inDomController.off, { once: true })
        }, 0)
      })
    }
  }, [show])

  return inDomTree ? (
    <Div domRef={ref} className={duringTransition ? currentClassName ?? '' : undefined}>
      {shrinkToValue(children, [{ phase: currentPhase, duringTransition }])}
    </Div>
  ) : null
}
