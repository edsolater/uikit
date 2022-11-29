import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'

type Component<Props> = (props: Props) => JSX.Element
type ReactComponent<Props> = (props: Props) => JSX.Element

export function componentkit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<DivProps, 'children'>
): ReactComponent<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName((props) => {
    const merged = mergeProps(defaultDivProps ?? {}, props, { className: displayName })
    return (
      <AddProps {...merged}>
        {FC(props)}
      </AddProps>
    )
  }, displayName)
  return componentkitFC
}
