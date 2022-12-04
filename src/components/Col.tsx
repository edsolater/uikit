import { Div, DivChildNode } from '../Div'
import { uikit } from './utils'

export interface ColProps {
  children?: DivChildNode
  wrap?: boolean
  name?: string // same as `<Group>`'s grid
}

/**
 * flex box
 */
export const Col = uikit('Col', ({ wrap, children }: ColProps) => (
  <Div icss={{ display: 'flex', flexDirection: 'column', flexWrap: wrap ? 'wrap' : undefined, alignItems: 'center' }}>
    {children}
  </Div>
))
