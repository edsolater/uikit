import { Div } from '.'
import type { DivProps } from './Div'
import { rowFlavor, RowFlavorProps } from './RowBaseStyle'

export interface RowProps extends DivProps, RowFlavorProps {}

/**
 * @uikitComponent
 *
 * 将子元素显示在一行，相当于flexbox
 */
const Row = ({ flavor, noDefaultFlavor, className, ...restProps }: RowProps) => {
  const baseFlavor = rowFlavor(flavor)
  return <Div {...restProps} className={['Row', !noDefaultFlavor && baseFlavor, className]} />
}
export default Row
