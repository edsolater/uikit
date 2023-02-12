import { flapDeep, isString, MayArray, MayDeepArray, Numberish, overwriteFunctionName, pipe } from '@edsolater/fnkit'
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
  PivifiedProps extends PivifyProps<ValidProps>,
  Status extends ValidStatus = {},
  TagName extends keyof HTMLTagMap = 'div',
  Plugins extends MayDeepArray<Plugin<any>> = Plugin<unknown>
> = PivifiedProps &
  Omit<DivProps<Status, TagName>, keyof PivifiedProps | 'plugin' | 'shadowProps'> &
  Omit<GetPluginProps<Plugins>, keyof PivifiedProps | 'plugin' | 'shadowProps'> &
  Omit<
    {
      plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
      shadowProps?: MayDeepArray<Partial<PivifiedProps>> // component must merged before `<Div>`
      _promisePropsConfig?: ValidPromisePropsConfig<PivifiedProps>
      // _status?: ValidStatus

      // -------- additional --------
      // auto inject status to it
      controller?: RefObject<Status>
    },
    keyof PivifiedProps
  >

/** just a shortcut of KitProps */
export type CreateKitProps<
  P extends ValidProps,
  O extends {
    extendsProp?: PivifyProps<ValidProps>
    status?: ValidStatus
    htmlPropsTagName?: keyof HTMLTagMap
    plugin?: MayDeepArray<Plugin<any>>
    /** props that should not accept promise or function */
    stableProps?: keyof P
  } = {}
> = KitProps<
  ExtendsProps<
    PivifyProps<P, NonNullable<O['status']>, O['stableProps'] extends {} ? NonNullable<O['stableProps']> : never>,
    NonNullable<O['extendsProp']>
  >,
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

type GetStatusFromPivifiedProps<T> = T extends PivifyProps<any, infer S> ? S : never
/**
 * **NOTE: outside props will add to componet's root node**
 * @param rawOptions component option
 * @param FC component code defin
 * @returns Component
 */
export function createKit<
  PivifiedProps extends PivifyProps<ValidProps>,
  Status extends ValidStatus = {},
  TagName extends keyof HTMLTagMap = 'div',
  Plugins extends MayDeepArray<Plugin<any>> = Plugin<any>
>(
  rawOptions: CreateKitOptions<DepivifyProps<PivifiedProps>, Status> | string,
  FC: (props: DepivifyProps<PivifiedProps>, utils: { setStatus: (inject: Status) => void }) => DivChildNode
): ReactComponent<KitProps<PivifiedProps, Status, TagName, Plugins>> {
  const options = isString(rawOptions) ? { name: rawOptions } : rawOptions

  const uikitFC = overwriteFunctionName((props) => {
    const statusRef = useRef<Status>(options.initStatus ?? ({} as Status)) // mamnually all createKit should have setStatus
    const setStatus = useEvent((inject: Status) => {
      statusRef.current = inject
    })
    props['controller'] && useImperativeHandle(props['controller'], () => statusRef.current)
    const [componentProps, divProps] = useKitProps<PivifiedProps, Status>(props)
    return <AddProps {...divProps}>{FC(componentProps, { setStatus })}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, options.name)

  return (options.reactMemo ? React.memo(uikitFC) : uikitFC) as (props) => JSX.Element
}

type WithDivChildren<
  Props extends ValidProps,
  Status extends ValidStatus = {},
  TagName extends keyof HTMLTagMap = 'div'
> = 'children' extends keyof Props ? Props : Props & Pick<DivProps<Status, TagName>, 'children'>

export function useKitProps<Props extends ValidProps, Status extends ValidStatus = {}>(
  props: Props,
  options?: CreateKitOptions<Props, Status>
): [componentProps: WithDivChildren<Props, Status, 'div'>, divProps: DivProps<Status>] {
  const mergedProps = pipe(
    props,
    (props) =>
      parsePropPluginToProps({ plugin: options?.plugin ? sortPlugin(options.plugin) : options?.plugin, props }), // defined-time
    (props) => mergeProps(options?.defaultProps ?? {}, props, { className: options?.name }), // defined-time
    (props) => handleDivPromiseProps(props, props['_status'], props['_promisePropsConfig']), // outside-props-run-time
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
