import type { CSSProperties } from 'react'
import Div, { DivProps } from './Div'

export interface CardProps extends DivProps {
  bgimgSrc?: CSSProperties['backgroundImage']
}

/**
 * @BaseUIComponent
 */
export default function Card({ bgimgSrc, className, style, ...restProps }: CardProps) {
  return (
    <Div
      {...restProps}
      className={['Card rounded-md py-4 px-8', className]}
      style={[{ background: bgimgSrc }, style]}
    />
  )
}
