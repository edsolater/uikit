import { Div, DivChildNode, DivProps } from '../Div'
import { createKit } from './utils'

export interface BoxProps extends DivProps {
  name?: string // for debug and DOM class
}

/**
 * element's container
 */
export const Box = createKit('Box', (props: BoxProps) => <Div>{props.children}</Div>)
