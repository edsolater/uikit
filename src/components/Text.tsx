import { Div, DivChildNode } from '../Div'
import { uikit } from './utils'

export interface TextProps {
  children?: DivChildNode
}

export const Text = uikit('Text', (props: TextProps) => props.children)
