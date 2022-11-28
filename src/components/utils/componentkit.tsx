import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { useMemo } from 'react'
import { Div, DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'

type Component<Props> = (props: Props) => JSX.Element

type ComponentRootProps = DivProps
type ComponentRoot = (componentkitProps?: ComponentRootProps) => JSX.Element

export function componentkit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (ComponentRoot: ComponentRoot) => Component<T>
): Component<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName((props) => {
    const KitRoot = useMemo(() => generateComponentRoot(props), [props])
    return ComponentConstructerFn(KitRoot)(props) ?? null
  }, displayName)
  return componentkitFC
}

function generateComponentRoot(props: DivProps) {
  const ComponentRoot = (componentkitProps?: ComponentRootProps) => (
    <Div {...mergeProps(props, componentkitProps)}>{componentkitProps?.children}</Div> //every time merge props will get a different result
  )
  return ComponentRoot
}
