import { Div, DivChildNode } from '../Div'
import { createKit } from './utils'

export interface GridProps {
  children?: DivChildNode
}

export const Grid = createKit('Grid', (props: { children?: DivChildNode }) => (
  <Div icss={{ display: 'grid' }}>{props.children}</Div>
))
