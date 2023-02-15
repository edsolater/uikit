import React from 'react'
import { CSSProperties } from 'react'
import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'

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
      shadowProps={restProps}
      class='Card'
      icss={
        !noDefaultStyle && {
          borderRadius: '6px',
          padding: '16px 32px',
          backgroundImage: bgimgSrc
        }
      }
    />
  )
}
