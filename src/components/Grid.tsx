import { Div, DivChildNode } from '../Div'
import { uikit } from './utils'

export interface GridProps {
  children?: DivChildNode
}

export const Grid = uikit('Grid', (props: { children?: DivChildNode }) => (
  <Div icss={{ display: 'grid' }}>{props.children}</Div>
))
