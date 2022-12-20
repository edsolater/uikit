import { flap, MayArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { mergeProps } from '../Div/utils/mergeProps'
import { AbilityPlugin } from './type'

export function createPropPlugin<P, T extends any[]>(
  createrFn: (
    props: P & DivProps
  ) => (...pluginCustomizedOptions: T) => Partial<Omit<P & DivProps, 'plugin' | 'shadowProps'>>, // return a function , in this function can exist hooks
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityPlugin {
  return (...args) => ({ getAdditionalProps: (props: any) => createrFn(props)(...args) })
}

export function createWrapperPlugin<T extends any[]>(
  createrFn: (node: ReactElement) => (...pluginCustomizedOptions: T) => ReactElement,
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityPlugin {
  return (...args) => ({
    getAdditionalProps: () => ({ dangerousRenderWrapperNode: (node) => createrFn(node)(...args) })
  })
}

export function handlePropPlugin<T extends DivProps>(
  props: T,
  plugins: MayArray<MayFn<AbilityPlugin<T>, [props: T]>> | undefined
) {
  return plugins
    ? flap(plugins).reduce(
        (acc, abilityPlugin) => mergeProps(acc, shrinkToValue(abilityPlugin, [acc]).getAdditionalProps?.(acc)),
        props
      )
    : props
}
