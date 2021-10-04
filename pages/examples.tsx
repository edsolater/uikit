import React, { useEffect } from 'react'

import ButtonExample from '../components/examples/ButtonExample'
import CardExample from '../components/examples/CardExample'
import FlowBlocksExample from '../components/examples/FlowBlocksExample'
import ScrollDivExample from '../components/examples/ScrollDivExample'
import TransitionExample from '../components/examples/TransitionExample'
import UseResizeObserverExample from '../components/examples/UseResizeObserverExample'

export default function PageExamples() {
  useEffect(() => {
    const aobj = {
      meaningfulA: 1,
      uselessB: 2
    }
    console.log('aobj.meaningfulA: ', aobj.meaningfulA)
  }, [])
  return (
    <div>
      <UseResizeObserverExample />
      <ScrollDivExample />
      <FlowBlocksExample />
      <TransitionExample />
      <ButtonExample />
      <CardExample />
    </div>
  )
}
