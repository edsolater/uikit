import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { RefObject, useRef } from 'react'
import { mergeProps } from '../../functions/react'
import { Div, DivProps, ShallowDivProps } from '../Div'

type Component<Props> = (props: Props) => JSX.Element

type UIKitRoot = (uikitProps?: DivProps) => JSX.Element

export function uikit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (KitRoot: UIKitRoot) => Component<T & Pick<DivProps, 'children'>>
): Component<T & DivProps & ShallowDivProps> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    const refedProps = useRef(props)
    const KitRoot = useRef(generateUIKitRoot(refedProps))
    return ComponentConstructerFn(KitRoot.current)(props) ?? null
  }, displayName)
  return uikitFC
}

function generateUIKitRoot(props: RefObject<DivProps & ShallowDivProps>) {
  const KitRoot = (uikitProps?: DivProps) => (
    <Div {...mergeProps(props.current, uikitProps)}>{uikitProps?.children}</Div>
  )
  return KitRoot
}
