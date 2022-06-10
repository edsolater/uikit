import React from 'react'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'
import Stat from '../../uikit/Stat'

export default function StatExample() {
  return (
    <ExampleCard title='stat' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Stat>
          <Stat.Label>world</Stat.Label>
        </Stat>
      </ExampleGroup>
    </ExampleCard>
  )
}
