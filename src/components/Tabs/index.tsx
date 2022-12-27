import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister } from '../../hooks'
import { letAddFloatBg, LetAddFloatBgOptions } from '../../plugins'
import { ControllerRef } from '../../typings/tools'
import { For } from '../For'
import { Row } from '../Row'
import { createKit } from '../utils'

export type TabsController<T> = {
  activeTab: T | undefined
}

export type TabsProps<T> = {
  tabs: T[]
  defaultTab?: T
  getKey: (tab: T) => string | number

  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<TabsController<T>>>
  componentId?: string

  // -------- sub --------
  renderLabel?: MayFn<ReactNode, [utils: { tab: T } & TabsController<T>]>
  anatomy?: {
    labelBox?: DivProps
    letAddFloatBgOptions?: LetAddFloatBgOptions
  }
}

export const Tabs = createKit(
  'Tabs',
  <T extends any>({ tabs, defaultTab, getKey, controller, componentId, renderLabel, anatomy }: TabsProps<T>) => {
    const [activeTab, setActiveTab] = useState(defaultTab)
    const innerController: TabsController<T> = {
      activeTab
    }
    if (controller) useControllerRegister(componentId, controller, innerController)

    return (
      <Row
        plugin={letAddFloatBg({
          ...anatomy?.letAddFloatBgOptions,
          defaultActiveItemIndex: defaultTab && tabs.indexOf(defaultTab)
        })}
      >
        <For each={tabs} getKey={getKey}>
          {(tab) => (
            <Div
              shadowProps={anatomy?.labelBox}
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
  }
)
