import { useIsomorphicLayoutEffect } from '@edsolater/hookit'
import { DivChildNode } from '../Div'
import { injectGlobalResetStyle } from '../styles'
import { createUikit } from './utils'

export interface AppRootProps {
  children?: DivChildNode
}

export const AppRoot = createUikit('Screen', ({ children }: AppRootProps) => {
  useIsomorphicLayoutEffect(injectGlobalResetStyle, [])
  return children
})
