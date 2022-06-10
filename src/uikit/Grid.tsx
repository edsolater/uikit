import Div, { DivProps } from './Div'

export interface GridProps extends DivProps {}

//TODO: should have some pre-defined grid template such as icon-text
/**
 * flex box
 */
export default function Grid({ icss, ...restProps }: GridProps) {
  return <Div {...restProps} icss={[{ display: 'grid' }, icss]} />
}
