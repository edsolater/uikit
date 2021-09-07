import type { DivProps } from './Div'
import type { BaseStyle } from './interface'
import { rowBaseStyle, RowBaseStyleProps } from './RowBaseStyle'
import UIRoot from './UIRoot'

export interface RowProps extends DivProps, BaseStyle<RowBaseStyleProps> {}

/**
 * @uikitComponent
 *
 * 将子元素显示在一行，相当于flexbox
 */
const Row = ({ baseStyle, ...restProps }: RowProps) => {
  const baseStyleClasses = rowBaseStyle(baseStyle)
  return <UIRoot _className={baseStyleClasses} {...restProps} />
}
export default Row
