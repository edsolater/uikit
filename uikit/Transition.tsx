// @see https://headlessui.dev/react/transition
import type { CSSProperties } from 'react'
import useToggle from '../hooks/useToggle'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'

export interface TransitionProps extends DivProps {
  show?: boolean
}

//应该也有个useTransition的hooks
/** @headless it will render a <Fragment /> */
export default function Transition({ show, children }: TransitionProps) {
  const [isInTransition, setFlagIsInTransition] = useToggle()

  // 关闭状态
  if (!show) return null

  return <>{children}</>
}
