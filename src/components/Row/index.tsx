import { ICSS } from '../../styles/parseCSS'
import { Div } from '../Div/Div'
import { DivProps, DerivativeDivProps } from '../Div/type'
import { cssRow } from './cssRow'

export interface RowProps extends DerivativeDivProps {}

/**
 * flex box (default has alignItems:center justifyContent:space-between)
 */
export function Row({ ...divProps }: RowProps) {
  return <Div {...divProps} icss_={[cssRow(), divProps.icss_]} className_={['Row', divProps.className_]} />
}

export const flexChildGrow: ICSS = {
  '& > * ': {
    flexGrow: 1
  }
}

export * from './cssRow'
