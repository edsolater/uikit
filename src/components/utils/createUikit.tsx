import { flap, isString, MayArray, MayDeepArray, overwriteFunctionName, pipe } from '@edsolater/fnkit'
import { DivProps } from '../../Div'
import { handleDivShadowProps } from '../../Div/handles/handleDivShallowProps'
import { mergeProps } from '../../functions/react'
import { handleDivPlugins } from '../../plugins/handleDivPlugins'
import { AbilityPlugin } from '../../plugins/type'
import { Component, ReactComponent } from '../../typings/tools'
import { AddProps } from '../AddProps'

export function uikit<T>(
  displayOptions: { name: string } | string,
  FC: Component<T>,
  options?: {
    defaultDivProps?: Omit<T & DivProps, 'children'>
    propsPlugin?: MayArray<AbilityPlugin<T & DivProps>>
  }
): ReactComponent<
  T & {
    plugin?: MayDeepArray<AbilityPlugin<T & DivProps>>
    shadowProps?: T & DivProps // component must merged before `<Div>`
  } & Omit<DivProps, 'children' | 'shadowProps'>
> {
  const displayName = isString(displayOptions) ? displayOptions : displayOptions.name
  const uikitFC = overwriteFunctionName((divProps) => {
    const merged = pipe(
      divProps,
      (props) =>
        flap(options?.propsPlugin ?? []).reduce(
          (acc, { getAdditionalProps }) => mergeProps(acc, getAdditionalProps?.(acc)),
          props
        ),
      (props) => mergeProps(options?.defaultDivProps ?? {}, props, { className: displayName }),
      handleDivShadowProps,
      handleDivPlugins
    )
    return <AddProps {...merged}>{merged && FC(merged)}</AddProps> // use `FC(props)` not `<FC {...props}>` because `FC(props)` won't create a new component in React's view, but `<FC {...props}>` will
  }, displayName)
  return uikitFC
}
