import { ICSS } from '../../styles/parseCSS'
import { Div } from '../Div/Div'
import { DivProps } from "../Div/type"
import { cssRow } from './cssRow'

export interface RowProps extends DivProps {}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 * @deprecated just use `<Div>`
 */
export function Row({ ...divProps }: RowProps) {
  return <Div {...divProps} icss_={cssRow()} className_='Row' />
}

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}

export * from './cssRow'
