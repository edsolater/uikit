import { Div } from './Div/Div'
import { DivProps } from './Div/type'

export interface GroupProps extends DivProps {
  name: string // for debug and css
}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export function Group({ name, ...divProps }: GroupProps) {
  return <Div {...divProps} className_={['Group', name]} />
}
