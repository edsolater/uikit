import { Div, DivChildNode } from '../Div'
import { createKit } from './utils'

export interface TextProps {
  inline?: boolean
  children?: DivChildNode
}

export const Text = createKit('Text', ({ children, inline }: TextProps) => {
  return (
    <Div
      icss={{
        display: inline ? 'inline-block' : undefined
      }}
    >
      {children}
    </Div>
  )
})
