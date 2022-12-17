import { flap, isString, MayArray, overwriteFunctionName } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

type componentPlugin<P> = (props: P) => Partial<P>

export function createComponentPlugin<P extends DivProps, T extends any[]>(
  createrFn: (props: P) => (...pluginCustomizedOptions: T) => Partial<P>, // return a function , in this function can exist hooks
  options?: {
    /* NOTE  add more */
  }
): (...pluginCustomizedOptions: T) => componentPlugin<P> {
  return (...pluginOptions) =>
    (props) =>
      createrFn(props)(...pluginOptions)
}

export function componentKit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<T & DivProps, 'children'>
): ReactComponent<T & { componentPlugin?: MayArray<componentPlugin<T>> } & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName(({ componentPlugin, ...divProps }) => {
    const merged = flap(componentPlugin as MayArray<componentPlugin<T>>).reduce(
      (acc, additionalProps) => mergeProps(acc, additionalProps(acc)),
      mergeProps(defaultDivProps ?? {}, divProps, {
        className: displayName
      })
    )
    return <AddProps {...divProps}>{FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return componentkitFC
}
