import type { FC } from 'react'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'

export interface CaptionProps extends DivProps {
  /**
   * for readability
   * @cssProps
   * @default 'left
   */
  align?: 'left' | 'center' | 'right'
}

const Caption: FC<CaptionProps> = ({ align = 'left', ...restProps }) => (
  <UIRoot
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
