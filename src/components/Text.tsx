import React from 'react'
import { Div } from './Div/Div'
import { DivProps } from './Div/type'

// text is not like
export interface TextProps extends DivProps {}

export function Text({ ...restProps }: TextProps) {
  return <Div className_='Text' {...restProps} />
}
