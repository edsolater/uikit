import { Div, DivChildNode, DivProps } from '../Div'
import { createKit } from './utils'

export interface GroupProps extends DivProps {
  name: string // for debug and css
}
export const Group = createKit('Group', (props: GroupProps) => <Div>{props.children}</Div>)
