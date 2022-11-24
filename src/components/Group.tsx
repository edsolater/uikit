import { DivChildNode } from '../Div'
import { uikit } from './utils'

export interface GroupProps {
  name: string // for debug and css
  children?: DivChildNode
}
export const Group = uikit('Group', (KitRoot) => (props: GroupProps) => <KitRoot>{props.children}</KitRoot>)

