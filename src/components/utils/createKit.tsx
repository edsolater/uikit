import { flapDeep, isString, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import React from 'react'
import { DivProps, HTMLTagMap } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../Div/utils/mergeProps'
import { parsePropPluginToProps } from '../../plugins'
import { handleDivPlugin, handlePivPromiseProps } from '../../plugins/handleDivPlugins'
import { Plugin } from '../../plugins/type'
import {
  Component,
  PivifyProps,
  ValidPromisePropsConfig,
  ReactComponent,
  ValidProps,
  ValidStatus,
  DePivifyProps
} from '../../typings/tools'
import { AddProps } from '../AddProps'

type GetPluginProps<T> = T extends Plugin<infer Px1>
  ? Px1
  : T extends Plugin<infer Px1>[]
  ? Px1
  : T extends (Plugin<infer Px1> | Plugin<infer Px2>)[]
  ? Px1 & Px2
  : T extends (Plugin<infer Px1> | Plugin<infer Px2> | Plugin<infer Px3>)[]
  ? Px1 & Px2 & Px3
  : T extends (Plugin<infer Px1> | Plugin<infer Px2> | Plugin<infer Px3> | Plugin<infer Px4>)[]
  ? Px1 & Px2 & Px3 & Px4
  : T extends (Plugin<infer Px1> | Plugin<infer Px2> | Plugin<infer Px3> | Plugin<infer Px4> | Plugin<infer Px5>)[]
  ? Px1 & Px2 & Px3 & Px4 & Px5
  : unknown

export type KitProp<
  Props,
  Status extends Record<string, any> = any,
  TagName extends keyof HTMLTagMap = any,
  Plugins extends MayDeepArray<Plugin<any>> = Plugin<unknown>
> = Props &
  Omit<DivProps<Status, TagName>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<GetPluginProps<Plugins>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<
    {
      plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
      shadowProps?: MayDeepArray<Partial<Props>> // component must merged before `<Div>`
    },
    keyof Props
  >

export type CreateKitOptions<T> = {
  name: string
  /**
   * if true, use React memo
   */
  reactMemo?: boolean
  defaultProps?: Omit<T, 'children'>
  plugin?: MayDeepArray<Plugin<any>>
}

/**
 * **NOTE: outside props will add to componet's root node**
 * @param rawOptions component option
 * @param FC component code defin
 * @returns Component
 * @deprecated use {@link useKitProps}
 */
export function createKit<Props extends ValidProps, Status extends ValidStatus = {}>(
  rawOptions: CreateKitOptions<Props> | string,
  FC: Component<Props>
): ReactComponent<
  {
    plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
    shadowProps?: MayDeepArray<Partial<Props>> // component must merged before `<Div>`
  } & Omit<PivifyProps<Props, Status>, 'shadowProps' | 'plugin'> & {
      _promisePropsConfig?: ValidPromisePropsConfig<Props>
      _status?: ValidStatus
    }
> {
  const options = isString(rawOptions) ? { name: rawOptions } : rawOptions
  const uikitFC = overwriteFunctionName((props) => {
    const mergedProps = pipe(
      props,
      (props) =>
        parsePropPluginToProps({ plugin: options?.plugin ? sortPlugin(options.plugin) : options?.plugin, props }), // defined-time
      (props) => mergeProps(options?.defaultProps ?? {}, props, { className: options.name }), // defined-time
      (props) => handlePivPromiseProps(props, props['_status'], props['_promisePropsConfig']), // outside-props-run-time
      handleDivShadowProps, // outside-props-run-time
      handleDivPlugin // outside-props-run-time
    )
    return <AddProps {...mergedProps}>{mergedProps && FC(mergedProps)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, options.name)
  return (options.reactMemo ? React.memo(uikitFC) : uikitFC) as (props) => JSX.Element
}

export function useKitProps<Props extends ValidProps, Status extends ValidStatus = {}>(
  props: Props,
  options?: CreateKitOptions<Props>
): [componentProps: DePivifyProps<Status, Props>, divProps: DivProps<Status>] {
  const mergedProps = pipe(
    props,
    (props) =>
      parsePropPluginToProps({ plugin: options?.plugin ? sortPlugin(options.plugin) : options?.plugin, props }), // defined-time
    (props) => mergeProps(options?.defaultProps ?? {}, props, { className: options?.name }), // defined-time
    (props) => handlePivPromiseProps(props, props['_status'], props['_promisePropsConfig']), // outside-props-run-time
    handleDivShadowProps, // outside-props-run-time
    handleDivPlugin // outside-props-run-time
  ) as Omit<Props, 'shadowProps' | 'plugin'>
  return [mergedProps as DePivifyProps<Status, Props> /* <-- FIX THIS TYPE */, mergedProps]
}

function sortPlugin(deepPluginList: MayDeepArray<Plugin<any>>) {
  const plugins = flapDeep(deepPluginList)
  if (plugins.length <= 1) return plugins
  if (plugins.every((p) => !p.priority)) return plugins

  return [...plugins].sort(({ priority: priorityA }, { priority: priorityB }) => (priorityB ?? 0) - (priorityA ?? 0))
}
