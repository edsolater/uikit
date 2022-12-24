import { isString, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../functions/react'
import { parsePropPluginToProps } from '../../plugins'
import { Plugin } from '../../plugins/type'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

export function createKit<T, Px1>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & Px1 & DivProps, 'children'>
    plugin?: [Plugin<Px1>]
  }
): ReactComponent<
  T &
    Omit<Px1, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<Px1 & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
>
export function createKit<T, Px1, Px2>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & Px1 & Px2 & DivProps, 'children'>
    plugin?: [Plugin<Px1>, Plugin<Px2>]
  }
): ReactComponent<
  T &
    Omit<Px1 & Px2, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<T & Px1 & Px2 & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
>
export function createKit<T, Px1, Px2, Px3>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & Px1 & Px2 & Px3 & DivProps, 'children'>
    plugin?: [Plugin<Px1>, Plugin<Px2>, Plugin<Px3>]
  }
): ReactComponent<
  T &
    Omit<Px1 & Px2 & Px3, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<T & Px1 & Px2 & Px3 & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
>
export function createKit<T, Px1, Px2, Px3, Px4>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & Px1 & Px2 & Px3 & Px4 & DivProps, 'children'>
    plugin?: [Plugin<Px1>, Plugin<Px2>, Plugin<Px3>, Plugin<Px4>]
  }
): ReactComponent<
  T &
    Omit<Px1 & Px2 & Px3 & Px4, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<T & Px1 & Px2 & Px3 & Px4 & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
>
export function createKit<T, Px1, Px2, Px3, Px4, Px5>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & Px1 & Px2 & Px3 & Px4 & Px5 & DivProps, 'children'>
    plugin?: [Plugin<Px1>, Plugin<Px2>, Plugin<Px3>, Plugin<Px4>, Plugin<Px5>]
  }
): ReactComponent<
  T &
    Omit<Px1 & Px2 & Px3 & Px4 & Px5, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<T & Px1 & Px2 & Px3 & Px4 & Px5 & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
>
export function createKit<T, F>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & F & DivProps, 'children'>
    plugin?: Plugin<F>[]
  }
): ReactComponent<
  T &
    Omit<F, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<T & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
> {
  const displayName = isString(displayOptions) ? displayOptions : displayOptions.name
  const uikitFC = overwriteFunctionName((props) => {
    const merged = pipe(
      props,
      (props) => parsePropPluginToProps({ plugin: options?.plugin, props }),
      (props) => mergeProps(options?.defaultProps ?? {}, props, { className: displayName }),
      handleDivShadowProps
    )
    return <AddProps {...merged}>{merged && FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}
