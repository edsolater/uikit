import { Div, DivChildNode } from '../Div'
import { createKit } from './utils'

export interface TextProps {
  children?: DivChildNode
}

export const Text = createKit('Text', ({ children }: TextProps) => {
  return <Div>{children}</Div>
})
