import { Div, DivChildNode } from '../Div'
import { injectGlobalResetStyle } from '../styles'
import { useInvokeOnce } from '../hooks'
import { uikit } from './utils'

export interface AppRootProps {
  rootId?: string
  children?: DivChildNode
}

export const AppRoot = uikit('AppRoot', ({ children, rootId }: AppRootProps) => {
  useInvokeOnce(injectGlobalResetStyle)
  return (
    <Div htmlProps={{ id: rootId }} icss={{ height: '100%' }}>
      {children}
    </Div>
  )
})
