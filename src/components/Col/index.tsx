import { Div, DivChildNode } from '../../Div'
import { uikit } from '../utils'
import { cssCol } from './cssCol'

export interface ColProps {
  children?: DivChildNode
}

/**
 * flex box
 */
export const Col = uikit<ColProps>('Col', ({ children }) => <Div icss={cssCol()}>{children}</Div>)

export * from './cssCol'
