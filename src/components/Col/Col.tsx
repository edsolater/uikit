import { Div, DivProps } from '../Div/Div'
import { cssCol } from './cssCol'

export interface ColProps extends DivProps {}

/**
 * flex box
 * @deprecated just use `<Div>`
 */
export function Col({ ...divProps }: ColProps) {
  return <Div {...divProps} icss_={cssCol()} className_='Col' />
}

export * from './cssCol'