import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister } from '../../hooks'
import { letAddFloatBg, LetAddFloatBgOptions } from '../../plugins'
import { ControllerRef } from '../../typings/tools'
import { For } from '../For'
import { Row, RowProps } from '../Row'
import { createKit } from '../utils'
import { letTabsStyle } from './plugins/letTabsStyle'

export type TabsController<T> = {
  activeTab: T | undefined
  activeTabIndex: number | undefined
}

export type TabsCoreProps<T> = {
  tabs: T[]
  defaultTab?: T
  getKey: (tab: T) => string | number

  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<TabsController<T>>>
  componentId?: string

  // -------- sub --------
  renderLabel?: MayFn<ReactNode, [utils: { tab: T } & TabsController<T>]>
  anatomy?: {
    container?: MayFn<RowProps, [utils: TabsController<T>]>
    labelBox?: MayFn<DivProps, [utils: TabsController<T>]>
    letAddFloatBgOptions?: MayFn<LetAddFloatBgOptions, [utils: TabsController<T>]>
  }
}

export type TabsProps<T> = TabsCoreProps<T> // can & plugin

export const Tabs = createKit(
  'Tabs',
  <T extends any>({ tabs, defaultTab, getKey, controller, componentId, renderLabel, anatomy }: TabsProps<T>) => {
    const [activeTab, setActiveTab] = useState(defaultTab)
    const innerController: TabsController<T> = {
      activeTab,
      activeTabIndex: activeTab && tabs.indexOf(activeTab)
    }
    if (controller) useControllerRegister(componentId, controller, innerController)

    return (
      <Row
        plugin={letAddFloatBg({
          ...shrinkToValue(anatomy?.letAddFloatBgOptions, [innerController]),
          defaultActiveItemIndex: defaultTab && tabs.indexOf(defaultTab)
        })}
        shadowProps={shrinkToValue(anatomy?.container, [innerController])}
      >
        <For each={tabs} getKey={getKey}>
          {(tab) => (
            <Div
              shadowProps={shrinkToValue(anatomy?.labelBox, [innerController])}
              onClick={() => {
                setActiveTab(tab)
              }}
            >
              {shrinkToValue(renderLabel, [{ tab, ...innerController }]) ?? String(tab)}
            </Div>
          )}
        </For>
      </Row>
    )
  },
  {
    plugin: [letTabsStyle]
  }
)
