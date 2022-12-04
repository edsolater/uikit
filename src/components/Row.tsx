import { Div, DivChildNode } from '../Div'
import { ICSS } from '../styles/parseCSS'
import { uikit } from './utils'

export interface RowProps {
  children?: DivChildNode
  wrap?: boolean
  name?: string // same as `<Group>`'s grid
}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export const Row = uikit('Row', ({ children, wrap }: RowProps) => (
  <Div icss={{ display: 'flex', flexWrap: wrap ? 'wrap' : undefined, alignItems: 'center' }}>{children}</Div>
))

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}
