import { Div } from './Div/Div'
import { DivProps } from './Div/type'

export interface GroupProps extends DivProps {
  name: string // for debug
}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export function Group({ ...divProps }: GroupProps) {
  return <Div {...divProps} className_='Group' />
}
