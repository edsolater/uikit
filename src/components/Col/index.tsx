import { Div } from '../Div/Div'
import { DerivativeDivProps } from "../Div/type"
import { cssCol } from './cssCol'

export interface ColProps extends DerivativeDivProps {}

/**
 * flex box
 */
export function Col({ ...divProps }: ColProps) {
  return <Div {...divProps} icss_={[cssCol(), divProps.icss_]} className_={['Col', divProps.className_]} />
}

export * from './cssCol'
