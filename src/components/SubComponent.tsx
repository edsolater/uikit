import * as React from 'react'
import { Div } from './Div/Div'
import { DivProps } from './Div/type'

export type SubComponentProps = {
  childIsRoot?: boolean
} & DivProps

export function SubComponent({ childIsRoot, ...divProps }: SubComponentProps) {
  return <Div {...divProps} />
}
