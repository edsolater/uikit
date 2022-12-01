import { Div, DivChildNode } from '../Div'
import { uikit } from './utils'

export interface TextProps {
  children?: DivChildNode
}

export const Text = uikit('Text', ({ children }: TextProps) => {
  return <Div>{children}</Div>
})
