import type { ReactNode } from 'react'
import type { DivProps } from '../Div'
import type { TransitionEffectLabel } from './transitionEffect'
import type { MayArray } from '../../typings/tools'
import { useEffect, useRef } from 'react'
import Div from '../Div'
import useThenableState from '../../hooks/usePromisedState'
import { transitionEffectLabels, transitionEffects } from './transitionEffect'
import { pickValues } from '../../functions/pickValues'
import useBFlag from '../../hooks/useBFlag'
import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'

export type TransitionPhase = 'enter' | 'leave' | 'showing' | 'hidden'

export interface TransitionProps extends DivProps {
  show: boolean
  effect?: MayArray<TransitionEffectLabel>
  children?: ReactNode | ((state: { phase: TransitionPhase; inTransition: boolean }) => ReactNode)
}

//应该也有个useTransition的hooks
/** @headless it will render a <Fragment /> */
export default function Transition({ show, children, effect = transitionEffectLabels[0] }: TransitionProps) {
  const transitionEffect = pickValues(transitionEffects, effect) // TODO currently, there is no type.
  const enterFromClassName = transitionEffect.map((ef) => `${ef.enter} ${ef.enterFrom}`).join(' ')
  const enterToClassName = transitionEffect.map((ef) => `${ef.enter} ${ef.enterTo}`).join(' ')
  const leaveFromClassName = transitionEffect.map((ef) => `${ef.leave} ${ef.leaveFrom}`).join('  ') // 2 space for different from `${enter} ${enterTo}`
  const leaveToClassName = transitionEffect.map((ef) => `${ef.leave} ${ef.leaveTo}`).join('  ')
  const inDomTree = useBFlag(show) // this will equal to show, when it's not transition.
  const inTransition = useBFlag()
  const [currentClassName, setcurrentClassName] = useThenableState<string>()
  const ref = useRef<HTMLDivElement>()
  // shortcut
  const currentPhase: TransitionPhase =
    show && !inTransition ? 'showing' : show && inTransition ? 'enter' : !show && inTransition ? 'leave' : 'hidden'

  useEffect(() => {
    if (ref.current) ref.current.dataset['phase'] = currentPhase
  }, [currentPhase])

  useEffect(() => {
    if (show && !inDomTree.value) {
      inDomTree.on()
      inTransition.on()
      setcurrentClassName(enterFromClassName).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(enterToClassName)
          ref.current?.addEventListener('transitionend', () => inTransition.off(), {
            once: true
          })
        }, 0)
      })
    }
  }, [show])

  useEffect(() => {
    if (!show && inDomTree.value) {
      inTransition.on()
      setcurrentClassName(leaveFromClassName).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(leaveToClassName)
          ref.current?.addEventListener('transitionend', inTransition.off, { once: true })
          ref.current?.addEventListener('transitionend', inDomTree.off, { once: true })
        }, 0)
      })
    }
  }, [show])

  return inDomTree.value ? (
    <Div domRef={ref} className={inTransition.value ? currentClassName ?? '' : undefined}>
      {shrinkToValue(children, [{ phase: currentPhase, inTransition: inTransition }])}
    </Div>
  ) : null
}
