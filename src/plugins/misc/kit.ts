import { ReactElement } from 'react'
import { createWrapperPluginFn } from '../createPlugin'

export type KitPluginOptions = {}

export const Kit = createWrapperPluginFn(
  (node) => (wrapperCreator: (self: ReactElement, options?: KitPluginOptions) => ReactElement) => wrapperCreator(node)
)
