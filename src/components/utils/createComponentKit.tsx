import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

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
