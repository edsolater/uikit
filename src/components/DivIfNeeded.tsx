import { isValidElement } from 'react'
import { Div, DivChildNode } from '../Div'
import { AddProps } from './AddProps'
import { createKit } from './utils'

export interface DivIfNeededProps {
  name?: string // for debug and DOM class
  children?: DivChildNode
}

/**
 * if ReactElement, use <AddProps>; if string, use <Div>;
 */
export const DivIfNeeded = createKit('DivIfNeeded', (props: DivIfNeededProps) =>
  isValidElement(props.children) ? <AddProps>{props.children}</AddProps> : <Div>{props.children}</Div>
)
