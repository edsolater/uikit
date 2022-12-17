import { flap, isString, MayArray, overwriteFunctionName } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

type ComponentPropsPlugin<P> = (props: P) => Partial<P>

export function createComponentPropsPlugin<P extends DivProps, T extends any[]>(
  createrFn: (props: P) => (...pluginCustomizedOptions: T) => Partial<P>, // return a function , in this function can exist hooks
  options?: {
    /* NOTE  add more */
  }
): (...pluginCustomizedOptions: T) => ComponentPropsPlugin<P> {
  return (...pluginOptions) =>
    (props) =>
      createrFn(props)(...pluginOptions)
}

export function componentKit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<T & DivProps, 'children'>
): ReactComponent<T & { componentPropsPlugin?: MayArray<ComponentPropsPlugin<T>> } & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const componentkitFC = overwriteFunctionName(({ componentPropsPlugin, ...props }) => {
    const merged = flap(componentPropsPlugin as MayArray<ComponentPropsPlugin<T>>).reduce(
      (acc, additionalProps) => mergeProps(acc, additionalProps(acc)),
      mergeProps(defaultDivProps ?? {}, props, {
        className: displayName
      })
    )
    return <AddProps {...props}>{FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return componentkitFC
}
