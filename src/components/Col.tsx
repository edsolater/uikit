import { createICSS } from '../styles'
import { Div, DivProps } from './Div'

export interface ColProps extends DivProps {}

export const cssColBase = () => createICSS({ display: 'flex', flexDirection: 'column' })

/**
 * flex box
 */
export default function Col({ ...divProps }: ColProps) {
  return <Div {...divProps} icss_={cssColBase()} className_='Col' />
}
