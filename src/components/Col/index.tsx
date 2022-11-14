import { uikit } from '../utils'
import { cssCol } from './cssCol'

export interface ColProps {}

/**
 * flex box
 */
export const Col = uikit<ColProps>('Col', (KitRoot, { children }) => <KitRoot icss={cssCol()}>{children}</KitRoot>)

export * from './cssCol'
