import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { DivChildNode, DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'

type Component<Props> = (props: Props) => DivChildNode
type GetComponentProps<C extends Component<any>> = C extends Component<infer P> ? P : never
type ReactComponent<Props> = (props: Props) => JSX.Element

export function createUikit<C extends Component<any>>(
  options: { name: string } | string,
  FC: C,
  defaultDivProps?: Omit<DivProps & GetComponentProps<C>, 'children'>
): ReactComponent<GetComponentProps<C> & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    const merged = mergeProps(defaultDivProps, props, { className: displayName })
    return <AddProps {...merged}>{FC(props)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}
