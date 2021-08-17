import React from 'react'
import BaseUIDiv from './BaseUIDiv'
import { DivProps } from './Div'

export interface RowProps extends DivProps {
  /**
   * @cssProps
   * "横"盒子空隙的大小
   */
  gapSize?: 'small' | 'medium' | 'large'

  /**@cssProps */
  noStratch?: boolean
}


/**
 * @BaseUIComponent
 *
 * 将子元素显示在一行，相当于flexbox
 */
const Row = ({ gapSize = 'medium', noStratch, ...restProps }: RowProps) => {
  return (
    <BaseUIDiv
      {...restProps}
      _className={['flex', { small: 'gap-1', medium: 'gap-2', large: 'gap-4' }[gapSize], noStratch && 'items-center']}
    />
  )
}
export default Row
