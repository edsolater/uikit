import { ICSS } from '../../styles/parseCSS'
import { Div } from '../Div/Div'
import { uikit } from '../utils'
import { cssRow } from './cssRow'

export interface RowProps {}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export const Row = uikit<RowProps>('Row', ({ children }) => <Div icss={cssRow()}>{children}</Div>)

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}

export * from './cssRow'

