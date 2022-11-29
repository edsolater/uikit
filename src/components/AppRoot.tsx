import { useIsomorphicLayoutEffect } from '@edsolater/hookit'
import { DivChildNode } from '../Div'
import { injectGlobalResetStyle } from '../styles'
import { uikit } from './utils'

export interface AppRootProps {
  children?: DivChildNode
}

export const AppRoot = uikit('Screen', ({ children }: AppRootProps) => {
  useIsomorphicLayoutEffect(injectGlobalResetStyle, [])
  return children
})
