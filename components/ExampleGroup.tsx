import React from 'react'
import UIRoot from '../uikit/uiRoot'
import Caption from '../uikit/Caption'
import { DivProps } from '../uikit/Div'
import Row from '../uikit/Row'

interface ExampleGroupProps extends DivProps {
  caption?: string
}
export default function ExampleGroup({ caption, children, ...rest }: ExampleGroupProps) {
  return (
    <UIRoot {...rest} _className={`${ExampleGroup.name}`}>
      {caption && <Caption className='my-4 text-xl font-bold'>{caption}</Caption>}
      <Row noStratch>{children}</Row>
    </UIRoot>
  )
}
