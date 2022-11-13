import { Div } from '../Div/Div'
import { DerivativeDivProps } from '../Div/type'
import { cssGrid } from './cssGrid'

export interface GridProps extends DerivativeDivProps {}

export function Grid({ ...divProps }: GridProps) {
  return <Div {...divProps} icss_={[cssGrid(), divProps.icss_]} className_={['Grid', divProps.className_]} />
}

export * from './cssGrid'

