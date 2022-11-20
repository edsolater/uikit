import { ReactElement } from 'react'
import { DivProps } from '../type'
import { AbilityNormalPlugins, AbilityPlugin, AbilityWrapperPlugins } from './type'

export function createNormalPlugin<T extends any[]>(
  createrFn: (...pluginCustomizedOptions: T) => DivProps | undefined,
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityNormalPlugins {
  return (...args) => ({ isOutsideWrapperNode: false, additionalProps: createrFn(...args) ?? {} })
}

export function createWrapperPlugin<T extends any[]>(
  createrFn: (...pluginCustomizedOptions: T) => (node: ReactElement) => ReactElement,
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityWrapperPlugins {
  return (...args) => ({ isOutsideWrapperNode: true, getWrappedNode: createrFn(...args) })
}
