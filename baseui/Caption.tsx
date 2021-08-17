import React, { FC } from 'react'
import { DivProps } from './Div'
import BaseUIDiv from './BaseUIDiv'

export interface CaptionProps extends DivProps {
  /**
   * for readability
   * @cssProps
   * @default 'left
   */
  align?: 'left' | 'center' | 'right'
}

const Caption: FC<CaptionProps> = ({ align = 'left', ...restProps }) => (
  <BaseUIDiv
    {...restProps}
    _className={
      {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      }[align]
    }
  />
)

export default Caption
