import { flapDeep, isString, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../functions/react'
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

export function createKit<T, F extends MayDeepArray<Plugin<any>>>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & GetPluginProps<F> & DivProps, 'children'>
    plugin?: F
  }
): ReactComponent<
  T &
    Omit<GetPluginProps<F>, keyof T> & {
      plugin?: MayDeepArray<Partial<Plugin<T & DivProps>>>
      shadowProps?: Partial<T & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'>
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

/**
 * generic type will lose auto type intelligence with plugin.
 * this function's core is **same with createKit**
 */
export function createKitWithAutoPluginProp<T, F extends MayDeepArray<Plugin<any>>>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultProps?: Omit<T & GetPluginProps<F> & DivProps, 'children'>
    plugin?: F
  }
): <FR extends MayDeepArray<Plugin<any>>>(
  props: T &
    Omit<GetPluginProps<F>, keyof T> & {
      plugin?: FR
      shadowProps?: Partial<T & DivProps> // component must merged before `<Div>`
    } & Omit<DivProps, 'children' | 'shadowProps' | 'plugin'> &
    Omit<GetPluginProps<FR>, GetPluginProps<F> | keyof T>
) => JSX.Element {
  return createKit(displayOptions, FC, options)
}

function sortPlugin(deepPluginList: MayDeepArray<Plugin<any>>) {
  const plugins = flapDeep(deepPluginList)
  if (plugins.length <= 1) return plugins
  if (plugins.every((p) => !p.priority)) return plugins

  return [...plugins].sort(({ priority: priorityA }, { priority: priorityB }) => (priorityB ?? 0) - (priorityA ?? 0))
}
