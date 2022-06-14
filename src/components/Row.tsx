import { icssRow } from '../styles'
import { ICSS } from '../styles/parseCSS'
import { Div, DivProps } from './Div'

export interface RowProps extends DivProps {}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export default function Row({ ...divProps }: RowProps) {
  return <Div {...divProps} icss_={icssRow()} className_='Row' />
}

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}
