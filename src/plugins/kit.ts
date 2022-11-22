import { ReactElement } from 'react'
import { createWrapperPlugin } from './createPlugin'

export type KitPluginOptions = {}

export const Kit = createWrapperPlugin(
  (wrapperCreator: (self: ReactElement, options?: KitPluginOptions) => ReactElement) => {
    return (node) => wrapperCreator(node)
  }
)
