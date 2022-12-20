import { flap, MayArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { mergeProps } from '../Div/utils/mergeProps'
import { PluginAtom, PluginFunction, PluginAtoms } from './type'

export function createPropPluginFn<P, T extends any[]>(
  createrFn: (
    props: P & DivProps
  ) => (...pluginCustomizedOptions: T) => Partial<Omit<P & DivProps, 'plugin' | 'shadowProps'>>, // return a function , in this function can exist hooks
  options?: {
    pluginName?: string
  }
): PluginFunction<T> {
  return (...args) => ({ getAdditionalProps: (props: any) => createrFn(props)(...args) })
}

export function createWrapperPluginFn<T extends any[]>(
  createrFn: (node: ReactElement) => (...pluginCustomizedOptions: T) => ReactElement,
  options?: {
    pluginName?: string
  }
): PluginFunction<T> {
  return (...args) => ({
    getAdditionalProps: () => ({ dangerousRenderWrapperNode: (node) => createrFn(node)(...args) })
  })
}


export function handlePropPlugin<T extends DivProps>(
  plugins: PluginAtoms<T> | undefined,
  props: T,
) {
  return plugins
    ? flap(plugins).reduce(
        (acc, abilityPlugin) => mergeProps(acc, abilityPlugin.getAdditionalProps?.(acc)),
        props
      )
    : props
}
