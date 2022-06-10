import type { FC } from 'react'
import Div, { DivProps } from './Div'

export interface CaptionProps extends DivProps {
  /**
   * for readability
   * @cssProps
   * @default 'left
   */
  align?: 'left' | 'center' | 'right'
}

const Caption: FC<CaptionProps> = ({ align = 'left', className, ...restProps }) => (
  <Div
    {...restProps}
    className={[
      {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      }[align],
      className
    ]}
  />
)

export default Caption
