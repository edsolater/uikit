import React, {
  } from 'react'
import { Div, Item } from '../../uikit'

import DatePicker from '../../uikit/DatePicker/DatePicker'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'
import Tabbar from '../../uikit/Tabbar'

export function DatePickExample() {
  return (
    <ExampleCard title='DatePicker' category='uikit'>
      <ExampleGroup caption='Example'>
        <DatePicker />
      </ExampleGroup>
      <Div>
        <Div icss={{ fontSize: 18, fontWeight: 'bold' }}>TODO List</Div>
        <Div icss={{ marginBlock: 12 }}>1. abort calendar's transition when fast select another monther </Div>
        <Div icss={{ marginBlock: 12 }}>
          2. generate far away calendar. for example: current is 2022-1, jump to 2020-5
        </Div>
        <Div icss={{ marginBlock: 12 }}>3. get more compose pieces. So user can easier handle this component</Div>
      </Div>
    </ExampleCard>
  )
}

// let tabId
export function TabsExample() {
  // const { tabbarControlRef, panelRef, autoId } = useComponentTabs()
  // useEffect(() => {
  //   tabId = autoId
  // }, [autoId])
  return (
    <ExampleCard title='Tabbar' category='uikit'>
      <ExampleGroup caption='Example'>
        <Tabbar id='example-tabbar-id'>
          <Item>Tab 1</Item>
          <Item>Tab 2</Item>
          <Item>Tab 3</Item>
          <Item>Tab 4</Item>
          <Item>Tab 5</Item>
        </Tabbar>

        {/* <Panels componentRef={panelRef} for={autoId}>
          <Panel
            id='panel1' //@deprecated order should can auto detected
          >
            {[<div> jdjf</div>, <div> hello</div>]}
          </Panel>
        </Panels> */}
      </ExampleGroup>
    </ExampleCard>
  )
}


