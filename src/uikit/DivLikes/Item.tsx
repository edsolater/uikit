import { icssItemBaseStyle } from '../../styles'
import Div, { DivProps } from '../Div'

/** Div Derivative */

export default function Item({ noDefaultStyle, ...props }: { noDefaultStyle?: boolean } & DivProps) {
  return <Div {...props} icss_={[!noDefaultStyle && icssItemBaseStyle]} />
}
