import { Div, DivChildNode } from '../Div'
import { createKit } from './utils'

export interface BoxProps {
  name?: string // for debug and DOM class
  children?: DivChildNode
}

/**
 * element's container
 */
export const Box = createKit('Box', (props: BoxProps) => <Div>{props.children}</Div>)
