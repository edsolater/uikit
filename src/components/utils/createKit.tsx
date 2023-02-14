import {
  flapDeep,
  isString,
  MayArray,
  MayDeepArray,
  Numberish,
  overwriteFunctionName,
  pipe,
  SKeyof
} from '@edsolater/fnkit'
import React, { RefObject, useImperativeHandle, useRef } from 'react'
import { DivChildNode, DivProps, HTMLTagMap } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../Div/utils/mergeProps'
import { useEvent } from '../../hooks'
import { parsePropPluginToProps } from '../../plugins'
import { handleDivPlugin, handleDivPromiseProps } from '../../plugins/handleDivPlugins'
import { Plugin } from '../../plugins/type'
import {
  AddDefaultType,
  DepivifyProps,
  ExtendsProps,
  PivifyProps,
  ReactComponent,
  RequiredKey,
  ValidPromisePropsConfig,
  ValidProps,
  ValidStatus
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

/**
 * - auto add `plugin` `shadowProps` `_promisePropsConfig` `controller` props
 * - auto add Div's props
 * - auto pick plugin prop if specified plugin
 */
export type KitProps<
  Props,
  Plugins extends MayDeepArray<Plugin<any>> = Plugin<unknown>,
  TagName extends keyof HTMLTagMap = 'div'
> = Props &
  Omit<DivProps<TagName>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<GetPluginProps<Plugins>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<
    {
      plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
      shadowProps?: MayDeepArray<Partial<Props>> // component must merged before `<Div>`
      // _status?: ValidStatus

      // -------- additional --------
      // auto inject status to it
      statuRef?: RefObject<any>
    },
    keyof Props
  >

export type CreateKitOptions<T> = {
  defaultProps?: Omit<T, 'children'>
  plugin?: MayDeepArray<Plugin<any>>
}

type GetStatusFromPivifiedProps<T> = T extends PivifyProps<any, infer S> ? S : never

type WithDivChildren<
  Props extends ValidProps,
  TagName extends keyof HTMLTagMap = 'div'
> = 'children' extends keyof Props ? Props : Props & Pick<DivProps<TagName>, 'children'>

export function useKitProps<
  Props,
  Options extends {
    defaultProps?: Omit<Props, 'children'>
    plugin?: MayDeepArray<Plugin<any>>
  }
>(
  props: Props,
  options?: Options
): [props: WithDivChildren<RequiredKey<Props, keyof Options['defaultProps']>, 'div'>, divProps: Partial<DivProps>] {
  const mergedProps = pipe(
    props,
    (props) =>
      parsePropPluginToProps({ plugin: options?.plugin ? sortPlugin(options.plugin) : options?.plugin, props }), // defined-time
    (props) => mergeProps(options?.defaultProps ?? {}, props), // defined-time
    // (props) => handleDivPromiseProps(props, props['_status'], props['_promisePropsConfig']), // outside-props-run-time
    handleDivShadowProps, // outside-props-run-time
    handleDivPlugin // outside-props-run-time
  ) as any
  return [mergedProps /* <-- FIX THIS TYPE */, mergedProps]
}

function sortPlugin(deepPluginList: MayDeepArray<Plugin<any>>) {
  const plugins = flapDeep(deepPluginList)
  if (plugins.length <= 1) return plugins
  if (plugins.every((p) => !p.priority)) return plugins

  return [...plugins].sort(({ priority: priorityA }, { priority: priorityB }) => (priorityB ?? 0) - (priorityA ?? 0))
}
