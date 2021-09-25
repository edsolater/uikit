import React from 'react'
import ButtonExample from '../components/examples/ButtonExample'
import CardExample from '../components/examples/CardExample'
import FlowBlocksExample from '../components/examples/FlowBlocksExample'
import ScrollDivExample from '../components/examples/ScrollDivExample'
import TransitionExample from '../components/examples/TransitionExample'

export default function PageExamples() {
  return (
    <div>
      <ScrollDivExample />
      <FlowBlocksExample />
      <TransitionExample/>
      <ButtonExample />
      <CardExample />
    </div>
  )
}
