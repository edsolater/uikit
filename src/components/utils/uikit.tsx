import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { RefObject, useRef } from 'react'
import { mergeProps } from '../../functions/react'
import { Div, DivProps } from '../Div'

type Component<Props> = (props: Props) => JSX.Element

type UIKitRoot = (uikitProps?: DivProps) => JSX.Element

export function uikit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (KitRoot: UIKitRoot) => Component<T>
): Component<T & DivProps> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    const refedProps = useRef(props)
    const KitRoot = useRef(generateUIKitRoot(refedProps, displayName))
    return ComponentConstructerFn(KitRoot.current)(props) ?? null
  }, displayName)
  return uikitFC
}

function generateUIKitRoot(props: RefObject<DivProps>, displayName: string) {
  const KitRoot = (uikitProps?: DivProps) => (
    <Div {...mergeProps(props.current, uikitProps, { className: displayName })}>{uikitProps?.children}</Div>
  )
  return KitRoot
}
