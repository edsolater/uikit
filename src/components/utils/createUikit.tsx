import { isString, MayArray, MayDeepArray, MayFn, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../functions/react'
import { handlePropPlugin } from '../../plugins'
import { handleDivPlugins } from '../../plugins/handleDivPlugins'
import { PluginAtom } from '../../plugins/type'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

export function uikit<T>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultDivProps?: Omit<T & DivProps, 'children'>
    propsPlugin?: MayArray<PluginAtom<T & DivProps>>
  }
): ReactComponent<
  T & {
    plugin?: MayDeepArray<PluginAtom<T & DivProps>>
    shadowProps?: T & DivProps // component must merged before `<Div>`
  } & Omit<DivProps, 'children' | 'shadowProps'>
> {
  const displayName = isString(displayOptions) ? displayOptions : displayOptions.name
  const uikitFC = overwriteFunctionName((props) => {
    const merged = pipe(
      props,
      (props) => handlePropPlugin(options?.propsPlugin, props),
      (props) => mergeProps(options?.defaultDivProps ?? {}, props, { className: displayName }),
      handleDivShadowProps,
      handleDivPlugins
    )
    return <AddProps {...merged}>{merged && FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}
