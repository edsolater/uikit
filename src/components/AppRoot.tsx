import { Div, DivChildNode, DivProps } from '../Div'
import { injectGlobalResetStyle } from '../styles'
import { useInvokeOnce } from '../hooks'
import { createKit } from './utils'

export interface AppRootProps extends DivProps {
  rootId?: string
}

export const AppRoot = createKit('AppRoot', ({ children, rootId }: AppRootProps) => {
  useInvokeOnce(injectGlobalResetStyle)
  return (
    <Div htmlProps={{ id: rootId }} icss={{ height: '100%' }}>
      {children}
    </Div>
  )
})
