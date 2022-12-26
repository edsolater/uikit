import { overwriteFunctionName } from '@edsolater/fnkit'
import { mergeProps } from '../../Div/utils/mergeProps'
import { Component } from '../../typings/tools'

export function addDefaultProps<T>(Component: Component<T>, defaultProps: Partial<T>) {
  return overwriteFunctionName(
    //@ts-expect-error
    (props) => <Component {...mergeProps(defaultProps, props)} />,
    //@ts-expect-error
    Component.displayName ?? Component.name
  )
}
