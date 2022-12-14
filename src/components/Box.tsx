import { Div, DivChildNode } from '../Div'
import { uikit } from './utils'

export interface BoxProps {
  name?: string // for debug and DOM class
  children?: DivChildNode
}

/**
 * element's container
 */
export const Box = uikit('Box', (props: BoxProps) => <Div>{props.children}</Div>)
