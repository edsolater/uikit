import { Div } from '../Div/Div'
import { uikit } from '../utils'
import { cssCol } from './cssCol'

export interface ColProps {}

/**
 * flex box
 */
export const Col = uikit<ColProps>('Col', ({ children }) => <Div icss={cssCol()}>{children}</Div>)

export * from './cssCol'

