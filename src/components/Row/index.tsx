import { ICSS } from '../../styles/parseCSS'
import { Div, DivChildNode } from '../../Div'
import { createUikit } from '../utils'
import { cssRow } from './cssRow'

export interface RowProps {
  children?: DivChildNode
}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export const Row = createUikit<RowProps>('Row', ({ children }) => <Div icss={cssRow()}>{children}</Div>)

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}

export * from './cssRow'
