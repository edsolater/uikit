import React from 'react'
import Div, { DivProps } from './Div'

export interface LabelProps extends DivProps {
  for?: string
}

export default function Label({ ...divProps }: LabelProps) {
  return <Div {...divProps} />
}
