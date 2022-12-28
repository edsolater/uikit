import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister, useEvent, useRecordedEffect } from '../../hooks'
import { letAddFloatBg, LetAddFloatBgOptions } from '../../plugins'
import { ControllerRef } from '../../typings/tools'
import { Col } from '../Col'
import { For } from '../For'
import { Row, RowProps } from '../Row'
import { createKit } from '../utils'
import { letHandleMenuKeyboardShortcut } from './plugins/letHandleMenuKeyboardShortcut'
import { letMenuStyle } from './plugins/letMenuStyle'

export type MenuController<T> = {
  activeMenu: T | undefined
  activeMenuIndex: number | undefined
  toNext(): void
  toPrev(): void
  toFirst(): void
  toLast(): void
  to(index: number): void
  toMenu(menu: T): void
}

export type MenuCoreProps<T> = {
  menuItems: T[]
  defaultMenuItem?: T
  onChange?: (menuItem: T) => void
  getKey: (menuItem: T) => string | number

  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<MenuController<T>>>
  componentId?: string

  // -------- sub --------
  renderLabel?: MayFn<ReactNode, [utils: { menu: T } & MenuController<T>]>
  anatomy?: {
    container?: MayFn<RowProps, [utils: MenuController<T>]>
    labelBox?: MayFn<DivProps, [utils: MenuController<T>]>
    letAddFloatBgOptions?: MayFn<LetAddFloatBgOptions, [utils: MenuController<T>]>
  }
}

export type MenuProps<T> = MenuCoreProps<T> // can & plugin

export const Menu = createKit(
  'Menu',
  <T extends any>({
    menuItems,
    defaultMenuItem,
    onChange,
    getKey,
    controller,
    componentId,
    renderLabel,
    anatomy
  }: MenuProps<T>) => {
    const [activeMenu, setActiveMenu] = useState(defaultMenuItem)
    const getCurrent = useEvent(() => activeMenu && menuItems.indexOf(activeMenu))
    const innerController: MenuController<T> = {
      activeMenu,
      activeMenuIndex: getCurrent(),
      toNext() {
        const current = getCurrent()
        const next = current != null ? current + 1 : 0
        setActiveMenu(menuItems.at(next % menuItems.length))
      },
      toPrev() {
        const current = getCurrent()
        const prev = current != null ? current - 1 : 0
        setActiveMenu(menuItems.at(prev))
      },
      toFirst() {
        setActiveMenu(menuItems.at(0))
      },
      toLast() {
        setActiveMenu(menuItems.at(-1))
      },
      to(index) {
        setActiveMenu(menuItems.at(index))
      },
      toMenu(menu) {
        setActiveMenu(menu)
      }
    }

    useRecordedEffect(
      ([prevActiveMenu]) => {
        if (activeMenu && activeMenu != prevActiveMenu) onChange?.(activeMenu)
      },
      [activeMenu]
    )

    if (controller) useControllerRegister(componentId, controller, innerController)
    return (
      <Col
        plugin={letAddFloatBg({
          ...shrinkToValue(anatomy?.letAddFloatBgOptions, [innerController]),
          activeItemIndex: getCurrent()
        })}
        shadowProps={shrinkToValue(anatomy?.container, [innerController])}
      >
        <For each={menuItems} getKey={getKey}>
          {(menu) => (
            <Div
              shadowProps={shrinkToValue(anatomy?.labelBox, [innerController])}
              onClick={() => {
                setActiveMenu(menu)
              }}
            >
              {shrinkToValue(renderLabel, [{ menu, ...innerController }]) ?? String(menu)}
            </Div>
          )}
        </For>
      </Col>
    )
  },
  {
    plugin: [letMenuStyle, letHandleMenuKeyboardShortcut]
  }
)
