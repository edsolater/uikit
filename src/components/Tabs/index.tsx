import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister, useEvent, useRecordedEffect } from '../../hooks'
import { letAddFloatBg, LetAddFloatBgOptions } from '../../plugins'
import { ControllerRef } from '../../typings/tools'
import { For } from '../For'
import { Row, RowProps } from '../Row'
import { createKit } from '../utils'
import { letHandleTabsKeyboardShortcut } from './plugins/letHandleTabsKeyboardShortcut'
import { letTabsStyle } from './plugins/letTabsStyle'

export type TabsController<T> = {
  activeTab: T | undefined
  activeTabIndex: number | undefined
  toNext(): void
  toPrev(): void
  toFirst(): void
  toLast(): void
  to(index: number): void
  toTab(tab: T): void
}

export interface TabsProps<T> extends DivProps {
  tabs: T[]
  defaultTab?: T
  onChange?: (tab: T) => void
  getKey?: (tab: T) => string | number

  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<TabsController<T>>>
  componentId?: string

  // -------- sub --------
  renderLabel?: MayFn<ReactNode, [utils: { tab: T } & TabsController<T>]>
  anatomy?: {
    container?: MayFn<RowProps & DivProps, [utils: TabsController<T>]>
    labelBox?: MayFn<DivProps, [utils: TabsController<T>]>
    letAddFloatBgOptions?: MayFn<LetAddFloatBgOptions, [utils: TabsController<T>]>
  }
}

export const Tabs = createKit(
  { name: 'Tabs', plugin: [letTabsStyle, letHandleTabsKeyboardShortcut] },
  <T extends any>({
    tabs,
    defaultTab,
    onChange,
    getKey,
    controller,
    componentId,
    renderLabel,
    anatomy
  }: TabsProps<T>) => {
    const [activeTab, setActiveTab] = useState(defaultTab)
    const getCurrent = useEvent(() => activeTab && tabs.indexOf(activeTab))
    const innerController: TabsController<T> = {
      activeTab,
      activeTabIndex: getCurrent(),
      toNext() {
        const current = getCurrent()
        const next = current != null ? current + 1 : 0
        setActiveTab(tabs.at(next % tabs.length))
      },
      toPrev() {
        const current = getCurrent()
        const prev = current != null ? current - 1 : 0
        setActiveTab(tabs.at(prev))
      },
      toFirst() {
        setActiveTab(tabs.at(0))
      },
      toLast() {
        setActiveTab(tabs.at(-1))
      },
      to(index) {
        setActiveTab(tabs.at(index))
      },
      toTab(tab) {
        setActiveTab(tab)
      }
    }

    useRecordedEffect(
      ([prevActiveTab]) => {
        if (activeTab && activeTab != prevActiveTab) onChange?.(activeTab)
      },
      [activeTab]
    )

    if (controller) useControllerRegister(componentId, controller, innerController)
    return (
      <Row
        plugin={letAddFloatBg({
          ...shrinkToValue(anatomy?.letAddFloatBgOptions, [innerController]),
          activeItemIndex: getCurrent()
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
  }
)
