import { Div, DivChildNode } from '../Div'
import { createUikit } from './utils'

export interface GroupProps {
  name: string // for debug and css
  children?: DivChildNode
}
export const Group = createUikit('Group', (props: GroupProps) => <Div>{props.children}</Div>)
