import { Div } from '.'
import type { DivProps } from './Div'
import type { BaseStyle } from './interface'
import { rowBaseStyle, RowBaseStyleProps } from './RowBaseStyle'

export interface RowProps extends DivProps, BaseStyle<RowBaseStyleProps> {}

/**
 * @uikitComponent
 *
 * 将子元素显示在一行，相当于flexbox
 */
const Row = ({ baseStyle, className, ...restProps }: RowProps) => {
  const baseStyleClasses = rowBaseStyle(baseStyle)
  return <Div {...restProps} className={[baseStyleClasses, className]} />
}
export default Row
