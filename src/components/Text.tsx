import { Div, DivChildNode } from '../Div'
import { createUikit } from './utils'

export interface TextProps {
  children?: DivChildNode
}

export const Text = createUikit<TextProps>('Text', (props) => props.children)
