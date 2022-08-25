import { FC } from 'react'
import { AddProps } from './AddProps'
import { Div } from './Div/Div'
import { DivProps } from "./Div/type"

export type SubComponentProps = {
  childIsRoot?: boolean
} & DivProps

export function SubComponentRoot({ childIsRoot, ...divProps }: SubComponentProps) {
  const Root = (childIsRoot ? AddProps : Div) as FC<DivProps>
  return <Root {...divProps} />
}
