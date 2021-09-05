// @see https://headlessui.dev/react/transition
import { ReactNode, useMemo } from 'react'
import type { DivProps } from '../Div'
import { useEffect, useRef, useState } from 'react'
import Div from '../Div'
import useToggle from '../../hooks/useToggle'
import usePromisedState from '../../hooks/usePromisedState'
import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'
import { fadeInTransitionEffect } from './transitionEffect'

type TransitionPhase = 'enter' | 'leave' | 'showing' | 'hidden'

export interface TransitionProps extends DivProps {
  show: boolean
  effect?: 'fade-in/fade-out' //TODO more!!
  children?:
    | ReactNode
    | ((state: { phase: TransitionPhase; duringTransition: boolean }) => ReactNode)
}

//应该也有个useTransition的hooks
/** @headless it will render a <Fragment /> */
export default function Transition({
  show,
  children,
  effect = 'fade-in/fade-out'
}: TransitionProps) {
  const [duringTransition, inTransitionController] = useToggle()
  const transitionEffect = { 'fade-in/fade-out': fadeInTransitionEffect }[effect] // TODO currently, there is no type.
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
      setcurrentClassName(`${transitionEffect.enter} ${transitionEffect.enterFrom}`).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(`${transitionEffect.enter} ${transitionEffect.enterTo}`)
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
      setcurrentClassName(
        `${transitionEffect.leave} ${transitionEffect.leaveFrom} ` /* ending space for different from `${enter} ${enterTo}` */
      ).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(`${transitionEffect.leave} ${transitionEffect.leaveTo} `)
          ref.current?.addEventListener('transitionend', inTransitionController.off, { once: true })
          ref.current?.addEventListener('transitionend', inDomController.off, { once: true })
        }, 0)
      })
    }
  }, [show])

  // TODO: should affact it's child
  return inDomTree ? (
    <Div domRef={ref} className={currentClassName ?? ''}>
      {shrinkToValue(children, [{ phase: currentPhase, duringTransition }])}
    </Div>
  ) : null
}
