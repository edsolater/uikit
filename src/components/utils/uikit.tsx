import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { mergeProps } from '../../functions/react'
import { Div, DivProps } from '../Div'

type Component<Props> = (props: Props) => JSX.Element

type UIKitRoot = (uikitProps?: DivProps) => JSX.Element

export function uikit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (KitRoot: UIKitRoot) => Component<T & { children?: ReactNode }>
): Component<T & { children?: ReactNode } & DivProps> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    const KitRoot = generateUIKitRoot(props)
    return ComponentConstructerFn(KitRoot)(props) ?? null
  }, displayName)
  return uikitFC
}

function generateUIKitRoot(props: DivProps) {
  const KitRoot = (uikitProps?: DivProps) => <Div {...mergeProps(props, uikitProps)}>{uikitProps?.children}</Div>
  return KitRoot
}
