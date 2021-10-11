import React from 'react'

import ButtonExample from '../components/examples/ButtonExample'
import CardExample from '../components/examples/CardExample'
import FlowBlocksExample from '../components/examples/FlowBlocksExample'
import ScrollDivExample from '../components/examples/ScrollDivExample'
import StatExample from '../components/examples/StatExample'
import TransitionExample from '../components/examples/TransitionExample'
import UseResizeObserverExample from '../components/examples/UseResizeObserverExample'

export default function PageExamples() {
  return (
    <div>
      <StatExample />
      <UseResizeObserverExample />
      <ScrollDivExample />
      <FlowBlocksExample />
      <TransitionExample />
      <ButtonExample />
      <CardExample />
    </div>
  )
}
