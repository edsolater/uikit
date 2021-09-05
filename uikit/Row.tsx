import UIRoot from './UIRoot'
import type { DivProps } from './Div'

export interface RowProps extends DivProps {
  /**
   * @cssProps
   * "横"盒子空隙的大小
   */
  gapSize?: 'small' | 'medium' | 'large'
}

/**
 * @uikitComponent
 *
 * 将子元素显示在一行，相当于flexbox
 */
const Row = ({ gapSize = 'medium', ...restProps }: RowProps) => {
  return (
    <UIRoot
      _className={[
        'Row',
        'flex',
        { small: 'gap-1', medium: 'gap-2', large: 'gap-4' }[gapSize],
        'items-center'
      ]}
      {...restProps}
    />
  )
}
export default Row
