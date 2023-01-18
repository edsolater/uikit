import { flapDeep, isString, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps, HTMLTagMap } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../Div/utils/mergeProps'
import { parsePropPluginToProps } from '../../plugins'
import { handleDivPlugin } from '../../plugins/handleDivPlugins'
import { Plugin } from '../../plugins/type'
import { Component, ReactComponent } from '../../typings/tools'
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
  TagName extends keyof HTMLTagMap = any,
  Status extends Record<string, any> = any,
  Plugins extends MayDeepArray<Plugin<any>> = Plugin<unknown>
> = Props &
  Omit<DivProps<TagName, Status>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<GetPluginProps<Plugins>, keyof Props | 'plugin' | 'shadowProps'> &
  Omit<
    {
      plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
      shadowProps?: MayDeepArray<Partial<Props>> // component must merged before `<Div>`
    },
    keyof Props
  >

export function createKit<T, F extends MayDeepArray<Plugin<any>>>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & GetPluginProps<F>, 'children'>
    plugin?: F
  }
): ReactComponent<
  T &
    Omit<GetPluginProps<F>, keyof T> & {
      plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
      shadowProps?: MayDeepArray<Partial<T>> // component must merged before `<Div>`
    } & Omit<T, 'children' | 'shadowProps' | 'plugin'>
> {
  const displayName = isString(displayOptions) ? displayOptions : displayOptions.name
  const uikitFC = overwriteFunctionName((props) => {
    const merged = pipe(
      props,
      // build-time
      (props) =>
        parsePropPluginToProps({ plugin: options?.plugin ? sortPlugin(options.plugin) : options?.plugin, props }),
      (props) => mergeProps(options?.defaultProps ?? {}, props, { className: displayName }),
      // run-time
      handleDivShadowProps,
      handleDivPlugin
    )
    return <AddProps {...merged}>{merged && FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}

function sortPlugin(deepPluginList: MayDeepArray<Plugin<any>>) {
  const plugins = flapDeep(deepPluginList)
  if (plugins.length <= 1) return plugins
  if (plugins.every((p) => !p.priority)) return plugins

  return [...plugins].sort(({ priority: priorityA }, { priority: priorityB }) => (priorityB ?? 0) - (priorityA ?? 0))
}
