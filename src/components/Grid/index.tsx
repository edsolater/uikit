import { Div, DivChildNode } from '../../Div'
import { createUikit } from '../utils'
import { cssGrid } from './cssGrid'

export interface GridProps {
  children?: DivChildNode
}

export const Grid = createUikit<GridProps>('Grid', (props) => <Div icss={cssGrid()}>{props.children}</Div>)

export * from './cssGrid'
