import { ReactElement } from 'react'
import { createDangerousRenderWrapperNodeFn } from '../createPlugin'

export type KitPluginOptions = {}

export const Kit = createDangerousRenderWrapperNodeFn(
  (node) => (wrapperCreator: (self: ReactElement, options?: KitPluginOptions) => ReactElement) => wrapperCreator(node)
)
