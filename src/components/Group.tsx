import { uikit } from './utils'

export interface GroupProps {
  name: string // for debug and css
}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export const Group = uikit<GroupProps>('Group', (KitRoot) => ({ children, name }) => <KitRoot>{children}</KitRoot>)
