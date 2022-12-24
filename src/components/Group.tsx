import { Div, DivChildNode } from '../Div'
import { createKit } from './utils'

export interface GroupProps {
  name: string // for debug and css
  children?: DivChildNode
}
export const Group = createKit('Group', (props: GroupProps) => <Div>{props.children}</Div>)
