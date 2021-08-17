import React from 'react'
import BaseUIDiv from '../baseui/BaseUIDiv'
import Caption from '../baseui/Caption'
import { DivProps } from '../baseui/Div'
import Row from '../baseui/Row'

interface ExampleGroupProps extends DivProps {
  caption?: string
}
export default function ExampleGroup({ caption, children, ...rest }: ExampleGroupProps) {
  return (
    <BaseUIDiv {...rest} _className={`${ExampleGroup.name}`}>
      {caption && <Caption className='my-4 text-xl font-bold'>{caption}</Caption>}
      <Row noStratch>{children}</Row>
    </BaseUIDiv>
  )
}
