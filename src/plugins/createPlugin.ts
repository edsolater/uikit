import { flapDeep, MayDeepArray } from '@edsolater/fnkit'
import { JSXElement } from 'solid-js'
import { DivProps } from '../Div/type'
import { mergeProps } from '../Div/utils/mergeProps'
import { Plugin } from './type'

export function createDangerousRenderWrapperNodePlugin<T>(
  createrFn: (insideNode: JSXElement, outsideProps: T & DivProps) => JSXElement,
  options?: {
    name?: string
  }
): Plugin<T> {
  function pluginMiddleware(addtionalProps) {
    return createDangerousRenderWrapperNodePlugin(
      (node, props) => createrFn(node, mergeProps(addtionalProps, props)),
      options
    )
  }
  pluginMiddleware.getProps = (props) => ({ dangerousRenderWrapperNode: (node) => createrFn(node, props) })
  return pluginMiddleware
}

export function createPlugin<T>(
  createrFn: (props: T & DivProps) => Partial<Omit<T & DivProps, 'plugin' | 'shadowProps'>>, // return a function , in this function can exist hooks
  options?: {
    priority?: number // NOTE -1:  it should be render after final prop has determine
    name?: string
  }
): Plugin<T> {
  function pluginMiddleware(addtionalProps) {
    return createPlugin((props) => createrFn(mergeProps(addtionalProps, props)), options)
  }
  pluginMiddleware.getProps = (props) => createrFn(props)
  pluginMiddleware.priority = options?.priority

  return pluginMiddleware
}

export function parsePropPluginToProps<T>(utils: {
  plugin: MayDeepArray<Plugin<T>> | undefined
  props: T & DivProps
}): T & DivProps {
  return utils.plugin
    ? flapDeep(utils.plugin).reduce((acc, abilityPlugin) => mergeProps(acc, abilityPlugin.getProps?.(acc)), utils.props)
    : utils.props
}
