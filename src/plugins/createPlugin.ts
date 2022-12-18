import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { AbilityPlugin } from './type'

export function createPropPlugin<P extends DivProps, T extends any[]>(
  createrFn: (props: P) => (...pluginCustomizedOptions: T) => Partial<Omit<P, 'plugin' | 'shadowProps'>>, // return a function , in this function can exist hooks
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
  // return (...args) => ({
  //   additionalProps: (props) => ({
  //     children: createrFn(props.children as ReactElement /* can attach plugin,must be ReactElement */)(...args)
  //   })
  // })
  return (...args) => ({
    getAdditionalProps: () => ({ dangerousRenderWrapperNode: (node) => createrFn(node)(...args) })
  })
}

// export function createPlugin<P extends DivProps, T extends any[]>(
//   createrFn: (utils: {
//     props: P
//     node: ReactElement
//   }) => (...pluginCustomizedOptions: T) => { props: Partial<Omit<P, 'plugin' | 'shadowProps'>>; node: ReactElement },
//   options?: {
//     pluginName?: string
//   }
// ): (...pluginCustomizedOptions: T) => AbilityPlugin {
//   // return (...args) => ({
//   //   additionalProps: (props) => ({
//   //     children: createrFn(props.children as ReactElement /* can attach plugin,must be ReactElement */)(...args)
//   //   })
//   // })
//   return (...pluginCustomizedOptions) => ({
//     getAdditionalProps: (props: any) => createrFn(props)(...pluginCustomizedOptions),
//     getWrappedNode: (node) => createrFn(node)(...pluginCustomizedOptions)
//   })
// }
