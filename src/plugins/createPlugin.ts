import { flapDeep, flatMap, MayArray, MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { mergeProps } from '../utils'
import { Plugx } from './type'

export function createDangerousRenderWrapperNodePlugx<T>(
  createrFn: (node: ReactElement, props: T & DivProps) => ReactElement,
  options?: {
    pluginName?: string
  }
): Plugx<T> {
  return {
    add: (additionalProps) =>
      createDangerousRenderWrapperNodePlugx(
        (node, props) => createrFn(node, mergeProps(additionalProps, props)),
        options
      ),

    getProps: (props) => ({ dangerousRenderWrapperNode: (node) => createrFn(node, props) })
  }
}

export function createPlugx<T>(
  createrFn: (props: T & DivProps) => Partial<Omit<T & DivProps, 'plugin' | 'shadowProps'>>, // return a function , in this function can exist hooks
  options?: {
    pluginName?: string
  }
): Plugx<T> {
  return {
    add: (additionalProps) => createPlugx((props) => createrFn(mergeProps(additionalProps, props)), options),
    getProps: (props) => createrFn(props)
  }
}

export function parsePropPluginToProps<T>(utils: {
  plugin: MayDeepArray<Plugx<T>> | undefined
  props: T & DivProps
}): T & DivProps {
  return utils.plugin
    ? flapDeep(utils.plugin).reduce(
        (acc, abilityPlugin) => mergeProps(acc, abilityPlugin.getProps?.(acc)),
        utils.props
      )
    : utils.props
}
