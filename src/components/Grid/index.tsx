import { Div, DivChildNode } from '../../Div'
import { uikit } from '../utils'
import { cssGrid } from './cssGrid'

export interface GridProps {
  children?: DivChildNode
}

export const Grid = uikit<GridProps>('Grid', (props) => <Div icss={cssGrid()}>{props.children}</Div>)

export * from './cssGrid'
