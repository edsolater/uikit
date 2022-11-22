import { DivChildNode } from '../../Div'
import { uikit } from '../utils'
import { cssGrid } from './cssGrid'

export interface GridProps {
  children?: DivChildNode
}

export const Grid = uikit<GridProps>('Grid', (KitRoot) => (props) => (
  <KitRoot icss={cssGrid()}>{props.children}</KitRoot>
))

export * from './cssGrid'
