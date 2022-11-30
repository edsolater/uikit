import { useIsomorphicLayoutEffect } from '@edsolater/hookit'
import { Div, DivChildNode } from '../Div'
import { injectGlobalResetStyle } from '../styles'
import { uikit } from './utils'

export interface AppRootProps {
  rootId?: string
  children?: DivChildNode
}

export const AppRoot = uikit('AppRoot', ({ children, rootId }: AppRootProps) => {
  useIsomorphicLayoutEffect(injectGlobalResetStyle, [])
  return (
    <Div htmlProps={{ id: rootId }} icss={{ height: '100%' }}>
      {children}
    </Div>
  )
})
