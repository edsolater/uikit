import { flap, isString, MayArray, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../functions/react'
import { handleDivPlugins } from '../../plugins/handleDivPlugins'
import { AbilityPlugin } from '../../plugins/type'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

export function componentKit<T>(
  options: { name: string } | string,
  FC: Component<T>,
  defaultDivProps?: Omit<T & DivProps, 'children'>
): ReactComponent<
  T & {
    plugin?: MayDeepArray<AbilityPlugin<T & DivProps>>
    shadowProps?: T & DivProps // component must merged before `<Div>`
  } & Omit<DivProps, 'children' | 'shadowProps'>
> {
  const displayName = isString(options) ? options : options.name
  const componentKitFC = overwriteFunctionName((divProps) => {
    const merged = pipe(
      mergeProps(defaultDivProps ?? {}, divProps, { className: displayName }),
      handleDivShadowProps,
      handleDivPlugins
    )
    return <AddProps {...merged}>{merged && FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return componentKitFC
}
