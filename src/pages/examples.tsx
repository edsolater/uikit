import { AnyFn, isFalsy, isFunction, map, onify, shakeFalsy, shakeNil } from '@edsolater/fnkit'
import React from 'react'

import ButtonExample from '../components/examples/ButtonExample'
import CardExample from '../components/examples/CardExample'
import CollapseExample from '../components/examples/CollapseExample'
import { DatePickExample, TabsExample } from '../components/examples/exampleBlocks'
import FlowBlocksExample from '../components/examples/FlowBlocksExample'
import ScrollDivExample from '../components/examples/ScrollDivExample'
import SplitViewExample from '../components/examples/SplitViewExample'
import StatExample from '../components/examples/StatExample'
import TransitionExample from '../components/examples/TransitionExample'
import UseResizeObserverExample from '../components/examples/UseResizeObserverExample'

export default function PageExamples() {
  return (
    <div>
      {/* <StatExample />
      <UseResizeObserverExample />
      <ScrollDivExample />
      <FlowBlocksExample /> */}
      <TransitionExample />
      <CollapseExample />
      <SplitViewExample />
      
      {/* <ButtonExample />
      <DatePickExample /> */}
      {/* <TabsExample /> */}
      {/* <CardExample /> */}
    </div>
  )
}
