import { flapDeep, MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { mergeProps } from '../Div/utils/mergeProps'
import { PluginAtoms, PluginFunction, WrapperNodeFn } from './type'

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

export function dealWithPropPlugin<T extends DivProps>(utils: {
  plugins: PluginAtoms<DivProps<any>> | undefined
  props: T
}): T {
  return utils.plugins
    ? flapDeep(utils.plugins).reduce(
        (acc, abilityPlugin) => mergeProps(acc, abilityPlugin.getAdditionalProps?.(acc)),
        utils.props
      )
    : utils.props
}

export function dealWithDangerousWrapperPlugins(utils: {
  innerNode: ReactElement
  dangerousRenderWrapperPlugin: MayDeepArray<WrapperNodeFn>
}): ReactElement {
  return flapDeep(utils.dangerousRenderWrapperPlugin).reduce(
    (prevNode, getWrappedNode) => getWrappedNode(prevNode),
    utils.innerNode
  )
}
