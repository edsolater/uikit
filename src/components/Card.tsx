import { CSSProperties } from 'react'
import { Div, DivProps } from './Div/Div'

export interface CardProps extends DivProps {
  noDefaultStyle?: boolean
  bgimgSrc?: CSSProperties['backgroundImage']
}

/**
 * @BaseUIComponent
 */
export function Card({ noDefaultStyle, bgimgSrc, ...restProps }: CardProps) {
  return (
    <Div
      {...restProps}
      className_='Card'
      icss_={
        !noDefaultStyle && {
          borderRadius: '6px',
          padding: '16px 32px',
          backgroundImage: bgimgSrc
        }
      }
    />
  )
}
