import Div, { DivProps } from './Div'

export default function List({ ...divProps }: DivProps) {
  return (
    <Div
      {...divProps}
      as='ul'
      className_='List'
      icss_={{ paddingInlineStart: 0, margin: 0 } /* reset ul left-padding */}
    />
  )
}
