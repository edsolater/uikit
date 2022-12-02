import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { DivChildNode, DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'

type Component<Props> = (props: Props) => DivChildNode
type ReactComponent<Props> = (props: Props) => JSX.Element

export function componentKit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<DivProps, 'children'>
): ReactComponent<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName((props) => {
    const merged = mergeProps(defaultDivProps ?? {}, props, { className: displayName })
    return <AddProps {...merged}>{FC(props)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return componentkitFC
}
