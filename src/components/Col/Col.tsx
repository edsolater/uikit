import React from 'react'
import { Div } from '../Div/Div'
import { DivProps } from "../Div/type"
import { cssCol } from './cssCol'

export interface ColProps extends DivProps {}

/**
 * flex box
 */
export function Col({ ...divProps }: ColProps) {
  return <Div {...divProps} icss_={cssCol()} className_='Col' />
}

export * from './cssCol'