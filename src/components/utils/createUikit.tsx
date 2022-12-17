import { flap, isString, MayArray, overwriteFunctionName } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

type UikitPlugin<P> = (props: P) => Partial<P>

export function createUikitPlugin<P extends DivProps, T extends any[]>(
  createrFn: (props: P) => (...pluginCustomizedOptions: T) => Partial<P>, // return a function , in this function can exist hooks
  options?: {
    /* NOTE  add more */
  }
): (...pluginCustomizedOptions: T) => UikitPlugin<P> {
  return (...pluginOptions) =>
    (props) =>
      createrFn(props)(...pluginOptions)
}

export function uikit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<T & DivProps, 'children'>
): ReactComponent<
  T & {
    uikitPlugin?: MayArray<UikitPlugin<T>>
    shadowProps?: T & DivProps // component must merged before `<Div>`
  } & Omit<DivProps, 'children' | 'shadowProps'>
> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName(({ componentPlugin, shadowProps, ...divProps }) => {
    const merged = flap(componentPlugin as MayArray<UikitPlugin<T>>).reduce(
      (acc, additionalProps) => mergeProps(acc, additionalProps(acc)),
      mergeProps(defaultDivProps ?? {}, divProps, shadowProps, {
        className: displayName
      })
    )
    return <AddProps {...divProps}>{FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}
