import { Div, DivChildNode, DivProps } from '../Div'
import { createKit } from './utils'

export interface TextProps extends DivProps {
  inline?: boolean
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
