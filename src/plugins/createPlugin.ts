import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { AbilityNormalPlugins, AbilityWrapperPlugins } from './type'

export function createNormalPlugin<T extends any[]>(
  createrFn: (props: DivProps) => (...pluginCustomizedOptions: T) => Partial<Omit<DivProps, 'plugins' | 'shadowProps'>>, // return a function , in this function can exist hooks
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityNormalPlugins {
  return (...args) => ({ isOutsideWrapperNode: false, additionalProps: (props) => createrFn(props)(...args) })
}

export function createWrapperPlugin<T extends any[]>(
  createrFn: (...pluginCustomizedOptions: T) => (node: ReactElement) => ReactElement,
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityWrapperPlugins {
  return (...args) => ({ isOutsideWrapperNode: true, getWrappedNode: createrFn(...args) })
}
