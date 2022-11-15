import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { mergeProps } from '../../functions/react'
import { Div, DivProps } from '../Div'

type Component<Props> = (props: Props) => JSX.Element

type ComponentRoot = (componentkitProps?: DivProps) => JSX.Element

export function componentkit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (ComponentRoot: ComponentRoot) => Component<T>
): Component<T & { children?: ReactNode } & DivProps> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName((props) => {
    const KitRoot = generateComponentRoot(props)
    return ComponentConstructerFn(KitRoot)(props) ?? null
  }, displayName)
  return componentkitFC
}

function generateComponentRoot(props: DivProps) {
  const ComponentRoot = (componentkitProps?: DivProps) => (
    <Div {...mergeProps(props, componentkitProps)}>{componentkitProps?.children}</Div>
  )
  return ComponentRoot
}
