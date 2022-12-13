import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { AbilityPlugin } from './type'

export function createPropPlugin<T extends any[]>(
  createrFn: (props: DivProps) => (...pluginCustomizedOptions: T) => Partial<Omit<DivProps, 'plugins' | 'shadowProps'>>, // return a function , in this function can exist hooks
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityPlugin {
  return (...args) => ({ additionalProps: (props) => createrFn(props)(...args) })
}

export function createWrapperPlugin<T extends any[]>(
  createrFn: (node: ReactElement) => (...pluginCustomizedOptions: T) => ReactElement,
  options?: {
    pluginName?: string
  }
): (...pluginCustomizedOptions: T) => AbilityPlugin {
  return (...args) => ({ getWrappedNode: (node) => createrFn(node)(...args) })
}
