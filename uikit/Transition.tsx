// @see https://headlessui.dev/react/transition
import type { ReactNode } from 'react'
import type { DivProps } from './Div'
import { useEffect, useRef, useState } from 'react'
import Div from './Div'
import useToggle from '../hooks/useToggle'
import usePromisedState from '../hooks/usePromisedState'
import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'

type TransitionPhase = 'enter' | 'leave' | 'showing' | 'hidden'

export interface TransitionProps extends DivProps {
  show: boolean
  effect?: 'fade-in/fade-out' //TODO more!!
  children?: ReactNode | ((state: { phase: TransitionPhase; duringTransition: boolean }) => ReactNode)
}
//应该也有个useTransition的hooks
/** @headless it will render a <Fragment /> */
export default function Transition({ show, children }: TransitionProps) {
  const [duringTransition, inTransitionController] = useToggle()

  const enter = 'transition-opacity ease-linear duration-300'
  const enterFrom = 'opacity-0'
  const enterTo = 'opacity-100'
  const leave = 'transition-opacity ease-linear duration-300'
  const leaveFrom = 'opacity-100'
  const leaveTo = 'opacity-0'

  const [inDomTree, inDomController] = useToggle(show) // this will equal to show, when it's not transition.
  const [currentClassName, setcurrentClassName] = usePromisedState<string>()

  const [phase, setPhase] = useState<TransitionPhase>(show ? 'showing' : 'hidden')
  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    const currentPhase: TransitionPhase =
      show && !duringTransition
        ? 'showing'
        : show && duringTransition
        ? 'enter'
        : !show && duringTransition
        ? 'leave'
        : 'hidden'
    if (ref.current) ref.current.dataset['phase'] = currentPhase
    setPhase(currentPhase)
  }, [show, duringTransition])

  useEffect(() => {
    if (show) {
      if (inDomTree) return
      inDomController.on()
      inTransitionController.on()
      setcurrentClassName(`${enter} ${enterFrom}`).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(`${enter} ${enterTo}`)
          ref.current?.addEventListener('transitionend', () => inTransitionController.off(), {
            once: true
          })
        }, 0)
      })
    } else {
      if (!inDomTree) return
      inTransitionController.on()
      setcurrentClassName(
        `${leave} ${leaveFrom} ` /* ending space for different from `${enter} ${enterTo}` */
      ).then(() => {
        // use timeout to force React commit setcurrentClassName. or it will automatic batching the change. which leads no transition
        setTimeout(() => {
          setcurrentClassName(`${leave} ${leaveTo} `)
          ref.current?.addEventListener('transitionend', inTransitionController.off, { once: true })
          ref.current?.addEventListener('transitionend', inDomController.off, { once: true })
        }, 0)
      })
    }
  }, [show])

  // TODO: should affact it's child
  return inDomTree ? (
    <Div domRef={ref} className={currentClassName ?? ''}>
      {shrinkToValue(children, [{ phase, duringTransition }])}
    </Div>
  ) : null
}
