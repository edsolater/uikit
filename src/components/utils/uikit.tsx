import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { DivChildNode, DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'

type Component<Props> = (props: Props) => DivChildNode
type ReactComponent<Props> = (props: Props) => JSX.Element

export function uikit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: Component<T>
): ReactComponent<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName(
    (props) => (
      <AddProps {...mergeProps(props, { className: displayName })}>{ComponentConstructerFn(props) ?? null}</AddProps>
    ),
    displayName
  )
  return uikitFC
}
