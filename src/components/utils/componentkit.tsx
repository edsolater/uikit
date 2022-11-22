import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { RefObject, useRef } from 'react'
import { mergeProps } from '../../functions/react'
import { Div, DivProps } from '../../Div'

type Component<Props> = (props: Props) => JSX.Element

type ComponentRootProps = DivProps
type ComponentRoot = (componentkitProps?: ComponentRootProps) => JSX.Element

export function componentkit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (ComponentRoot: ComponentRoot) => Component<T>
): Component<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName((props) => {
    const refedProps = useRef(props)
    const KitRoot = useRef(generateComponentRoot(refedProps))
    return ComponentConstructerFn(KitRoot.current)(props) ?? null
  }, displayName)
  return componentkitFC
}

function generateComponentRoot(props: RefObject<DivProps>) {
  const ComponentRoot = (componentkitProps?: ComponentRootProps) => (
    <Div {...mergeProps(props.current, componentkitProps)}>{componentkitProps?.children}</Div>
  )
  return ComponentRoot
}
