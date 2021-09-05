// @see https://headlessui.dev/react/transition
import { isExist } from '@edsolater/fnkit/src/judgers'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { CSSProperties, ReactNode, useLayoutEffect } from 'react'
import { Div } from '.'
import useToggle from '../hooks/useToggle'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'

export interface TransitionProps extends DivProps {
  show: boolean
  effect?: 'fade-in/fade-out' //TODO
}

//应该也有个useTransition的hooks
/** @headless it will render a <Fragment /> */

export default function Transition({ show, children }: TransitionProps) {
  const [isInTransition, setFlagIsInTransition] = useToggle()

  const enter = 'transition-opacity ease-linear duration-300'
  const enterFrom = 'opacity-0'
  const enterTo = 'opacity-100'
  const leave = 'transition-opacity ease-linear duration-300'
  const leaveFrom = 'opacity-100'
  const leaveTo = 'opacity-0'

  const [isInDomTree, isInDomTreeController] = useToggle(show)
  const [currentClassName, setcurrentClassName] = useStateWithCallback(
    show ? `${enter} ${enterFrom} ` : `${leave} ${leaveTo} ` // will break if it is '' . strange!
  )
  const [phase, setPhase] = useState<'enter' | 'leave'>('enter')
  const ref = useRef<HTMLDivElement>()

  // useEffect(() => {
  //   ref.current.dataset['phase'] = phase
  // }, [phase])

  useEffect(() => {
    if (show === true && !isInDomTree) {
      isInDomTreeController.on()
    }
    if (show === false && isInDomTree) {
      isInDomTreeController.off()
    }
  }, [show])

  useEffect(() => {
    console.log('isInDomTree: ', isInDomTree)
    if (isInDomTree === true) {
      console.log(1)
      setcurrentClassName(`${enter} ${enterFrom}`).then(() => {
        console.log(2, currentClassName)
        setcurrentClassName(`${enter} ${enterTo}`)
      })
    }
    return () => {
      setcurrentClassName('')
    }
  }, [isInDomTree])

  // TODO: should affact it's child
  return isInDomTree ? (
    <Div domRef={ref} className={currentClassName}>
      {children}
    </Div>
  ) : null
}

function useStateWithCallback<S = undefined>(
  initialState?: S | (() => S)
): [S, (value: SetStateAction<S>) => Promise<S>] {
  const [state, setState] = useState(initialState)
  const promiseResolve = useRef<(value: S) => void>()
  useEffect(() => {
    if (isExist(state) && isExist(promiseResolve.current)) promiseResolve.current(state)
  }, [state])
  const setStateWithCallback = (value: SetStateAction<S>) => {
    return new Promise<S>((resolve, reject) => {
      setState(value)
      promiseResolve.current = resolve
    })
  }
  return [state, setStateWithCallback]
}
