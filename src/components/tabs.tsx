import { pickProperty } from '@edsolater/fnkit'
import { useState } from 'react'
import { DivChildNode, DivProps, Div } from '../Div'
import { WithFloatBgOptions, withFloatBg } from '../plugins'
import { For } from './For'
import { Row } from './Row'
import { componentKit } from './utils'

export type TabItem<T extends string> = {
  value: T
  renderLabel?: (value: T) => DivChildNode
}

export type TabsProps<T extends string> = {
  tabs: TabItem<T>[]
  defaultTab?: TabItem<T>
  labelBoxProps?: DivProps
  withFloatBgOptions?: WithFloatBgOptions
}

export const Tabs = componentKit(
  'Tabs',
  <T extends string>({ tabs, defaultTab, labelBoxProps, withFloatBgOptions }: TabsProps<T>) => {
    const [activeTab, setActiveTab] = useState(defaultTab)
    return (
      <Row
        plugin={withFloatBg({ ...withFloatBgOptions, defaultActiveItemIndex: defaultTab && tabs.indexOf(defaultTab) })}
      >
        <For each={tabs} getKey={pickProperty('value')}>
          {(tab) => (
            <Div
              shadowProps={labelBoxProps}
              onClick={() => {
                setActiveTab(tab)
              }}
            >
              {tab.renderLabel?.(tab.value) ?? tab.value}
            </Div>
          )}
        </For>
      </Row>
    )
  }
)
