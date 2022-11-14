import { uikit } from '../utils'
import { cssGrid } from './cssGrid'

export interface GridProps {}

export const Grid = uikit<GridProps>('Grid', (KitRoot, props) => <KitRoot icss={cssGrid()}>{props.children}</KitRoot>)

export * from './cssGrid'

