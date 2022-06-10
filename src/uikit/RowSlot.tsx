import React from 'react'
import { DivProps } from './Div'
import Row from './Row'

export interface RowSlotProps extends DivProps {}

/**
 * typeically it's inner is block ui element
 *
 * semantic version of {@link Row \<Row>}
 *
 * `<RowSlot>` v.s. `<Row>`? `<RowSlot>` can have some preset about slot
 */
export default function RowSlot({ ...divProps }: RowSlotProps) {
  return <Row {...divProps} />
}
