import { Div, DivChildNode } from '../../Div'
import { uikit } from '../utils'
import { cssCol } from './cssCol'

export interface ColProps {
  children?: DivChildNode
}

/**
 * flex box
 */
export const Col = uikit('Col', ({ children }: ColProps) => <Div icss={cssCol()}>{children}</Div>)

export * from './cssCol'
