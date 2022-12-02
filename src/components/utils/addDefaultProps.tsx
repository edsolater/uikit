import { overwriteFunctionName } from '@edsolater/fnkit'
import { Component } from '../../typings/tools'
import { mergeProps } from '../../utils'

export function addDefaultProps<T>(Component: Component<T>, defaultProps: Partial<T>) {
  return overwriteFunctionName(
    //@ts-ignore
    (props) => <Component {...mergeProps(defaultProps, props)} />,
    //@ts-ignore
    Component.displayName ?? Component.name
  )
}
