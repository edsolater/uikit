import { ReactElement } from 'react'
import { createWrapperPlugin } from '../createPlugin'

export type KitPluginOptions = {}

export const Kit = createWrapperPlugin(
  (node) => (wrapperCreator: (self: ReactElement, options?: KitPluginOptions) => ReactElement) => wrapperCreator(node)
)
