import { flapDeep, MayDeepArray, pipe } from '@edsolater/fnkit'
import { RefObject } from 'react'
import { Ref } from 'solid-js'
import { DivProps, HTMLTagMap } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../Div/utils/mergeProps'
import { parsePropPluginToProps } from '../../plugins'
import { handleDivPlugin } from '../../plugins/handleDivPlugins'
import { Plugin } from '../../plugins/type'
import { ExtendsProps, ValidPromisePropsConfig, ValidProps, ValidStatus } from '../../typings/tools'

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
  Props extends ValidProps,
  Status extends ValidStatus = {},
  TagName extends keyof HTMLTagMap = 'div',
  Plugins extends MayDeepArray<Plugin<any>> = Plugin<unknown>
> = Props &
  Omit<DivProps<TagName>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<GetPluginProps<Plugins>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<
    {
      plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
      shadowProps?: MayDeepArray<Partial<Props>> // component must merged before `<Div>`
      _promisePropsConfig?: ValidPromisePropsConfig<Props>
      // _status?: ValidStatus

      // -------- additional --------
      // auto inject status to it
      statusRef?: Ref<Status>
    },
    keyof Props
  >

/** just a shortcut of KitProps */
export type CreateKitProps<
  P extends ValidProps,
  O extends {
    extendsProp?: ValidProps
    status?: ValidStatus
    htmlPropsTagName?: keyof HTMLTagMap
    plugin?: MayDeepArray<Plugin<any>>
  } = {}
> = KitProps<
  ExtendsProps<P, NonNullable<O['extendsProp']>>,
  NonNullable<O['status']>,
  NonNullable<O['htmlPropsTagName']>,
  NonNullable<O['plugin']>
>
export type CreateKitOptions<T, Status extends ValidStatus = {}> = {
  name: string
  /**
   * if true, use React memo
   */
  reactMemo?: boolean
  initStatus?: Status
  defaultProps?: Omit<T, 'children'>
  plugin?: MayDeepArray<Plugin<any>>
}

type WithDivChildren<
  Props extends ValidProps,
  TagName extends keyof HTMLTagMap = 'div'
> = 'children' extends keyof Props ? Props : Props & Pick<DivProps<TagName>, 'children'>

export function useKitProps<Props extends ValidProps, Status extends ValidStatus = {}>(
  props: Props,
  options?: CreateKitOptions<Props, Status>
): [componentProps: WithDivChildren<Props, 'div'>, divProps: DivProps] {
  const mergedProps = pipe(
    props,
    (props) =>
      parsePropPluginToProps({ plugin: options?.plugin ? sortPlugin(options.plugin) : options?.plugin, props }), // defined-time
    (props) => mergeProps(options?.defaultProps ?? {}, props, { className: options?.name }), // defined-time
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
