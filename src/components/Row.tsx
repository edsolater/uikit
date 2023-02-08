import { Div, DivChildNode, DivProps } from '../Div'
import { ICSS } from '../styles/parseCSS'
import { createKit } from './utils'

export interface RowProps {
  children?: DivChildNode
  /** CSS */
  wrap?: boolean

  /**@default 'md' */
  gap?: 'sm' /* 4px */ | 'md' /* 8px */ | 'lg' /* 16px */ | 'xl' /* 32px */

  /** CSS */
  itemFlexGrow?: boolean

  name?: string // same as `<Group>`'s grid
}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export const Row = createKit<RowProps>('Row', ({ children, itemFlexGrow, gap, wrap }) => (
  <Div
    icss={[
      {
        display: 'flex',
        gap: gap === 'xl' ? 32 : gap === 'lg' ? 16 : gap === 'sm' ? 4 : 8,
        flexWrap: wrap ? 'wrap' : undefined,
        alignItems: 'center'
      },
      itemFlexGrow ? flexChildGrow : undefined
    ]}
  >
    {children}
  </Div>
))

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}

