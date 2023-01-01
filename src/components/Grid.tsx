import { Div, DivChildNode, DivProps } from '../Div'
import { createKit } from './utils'

export interface GridProps extends DivProps {}

export const Grid = createKit('Grid', (props: GridProps) => <Div icss={{ display: 'grid' }}>{props.children}</Div>)
