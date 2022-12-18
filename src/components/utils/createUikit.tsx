import { isString, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../functions/react'
import { handleDivPlugins } from '../../plugins/handleDivPlugins'
import { AbilityPlugin } from '../../plugins/type'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

export function uikit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<T & DivProps, 'children'>
): ReactComponent<
  T & {
    plugins?: MayDeepArray<AbilityPlugin<T & DivProps>> // TODO: should use same name as <Div>'s plugins, for easier to remember
    shadowProps?: T & DivProps // component must merged before `<Div>`
  } & Omit<DivProps, 'children' | 'shadowProps'>
> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((divProps) => {
    const merged = pipe(
      mergeProps(defaultDivProps ?? {}, divProps, { className: displayName }),
      handleDivShadowProps,
      handleDivPlugins
    )
    return <AddProps {...merged}>{merged && FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}
