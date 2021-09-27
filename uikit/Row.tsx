import { Div } from '.'
import type { DivProps } from './Div'
import { rowTint, RowTintProps } from './RowBaseStyle'

export interface RowProps extends DivProps, RowTintProps {}

/**
 * @uikitComponent
 *
 * 将子元素显示在一行，相当于flexbox
 */
const Row = ({ tint, noDefaultTint, className, ...restProps }: RowProps) => {
  const baseTint = rowTint(tint)
  return <Div {...restProps} className={['Row', !noDefaultTint && baseTint, className]} />
}
export default Row
