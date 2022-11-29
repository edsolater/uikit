import { Div, DivChildNode } from '../../Div'
import { uikit } from '../utils'
import { cssGrid } from './cssGrid'

export interface GridProps {
  children?: DivChildNode
}

export const Grid = uikit('Grid', (props: GridProps) => <Div icss={cssGrid()}>{props.children}</Div>)

export * from './cssGrid'
