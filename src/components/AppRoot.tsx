import { Div, DivProps } from '../Div'
import { useInvokeOnce } from '../hooks'
import { injectGlobalResetStyle } from '../styles'
import { useKitProps } from './utils'

export interface AppRootProps extends DivProps {
  rootId?: string
}

export const AppRoot = (props: AppRootProps) => {
  const [{ children, rootId }, divProps] = useKitProps(props)
  useInvokeOnce(injectGlobalResetStyle)
  return (
    <Div shadowProps={divProps} htmlProps={{ id: rootId }} icss={{ height: '100%' }}>
      {children}
    </Div>
  )
}
