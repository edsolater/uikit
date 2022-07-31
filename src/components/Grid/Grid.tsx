import { Div, DivProps } from '../Div'
import { cssGrid } from './cssGrid'

export interface GridProps extends DivProps {}

/**
 * flex box
 * @deprecated just use `<Div>`
 */
export function Grid({ ...divProps }: GridProps) {
  return <Div {...divProps} icss_={cssGrid()} className_='Grid' />
}

export * from './cssGrid'