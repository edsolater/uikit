import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { mergeProps } from '../../Div/utils/mergeProps'
import { Component, ReactComponent } from '../../typings/tools'

type GetComponentProps<C extends Component<any>> = C extends Component<infer P> ? P : never

/**
 * @example
 * export const Root = renameKit(
 *   'Root',
 *   Div
 * )({
 *   icss: { display: 'grid', gridTemplateColumns: '300px 1fr' }
 * })
 */
export function renamedKit<C extends Component<any>>(
  options: { name: string } | string,
  FC: C,
  defaultProps?: Partial<GetComponentProps<C>>
): ReactComponent<GetComponentProps<C> & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    const merged = mergeProps(defaultProps, props, { className: displayName })
    //@ts-expect-error
    return <FC {...merged} /> // use `<FC {...props}>` not `FC(props)` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will. `<AddProps>` must have a direct `<Div>`-like uikit as child root
  }, displayName)
  return uikitFC
}
