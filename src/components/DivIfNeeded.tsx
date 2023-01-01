import { isValidElement } from 'react'
import { Div, DivChildNode, DivProps } from '../Div'
import { AddProps } from './AddProps'
import { createKit } from './utils'

export interface DivIfNeededProps extends DivProps {
  name?: string // for debug and DOM class
}

/**
 * if ReactElement, use <AddProps>; if string, use <Div>;
 */
export const DivIfNeeded = createKit('DivIfNeeded', (props: DivIfNeededProps) =>
  isValidElement(props.children) ? <AddProps>{props.children}</AddProps> : <Div>{props.children}</Div>
)
