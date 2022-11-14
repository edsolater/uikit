import { Div } from './Div/Div'
import { uikit } from './utils'

export interface GroupProps {
  name: string // for debug and css
}


/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export const Group = uikit<GroupProps>('Group', ({ children, name }) => <Div>{children}</Div>)
