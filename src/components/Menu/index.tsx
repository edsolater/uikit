import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister, useEvent, useRecordedEffect } from '../../hooks'
import { letAddFloatBg, LetAddFloatBgOptions } from '../../plugins'
import { ControllerRef } from '../../typings/tools'
import { AddProps } from '../AddProps'
import { Col, ColProps } from '../Col'
import { For } from '../For'
import { Popover } from '../Popover/Popover'
import { RowProps } from '../Row'
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

export interface MenuProps<T> extends DivProps {
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
    panel?: MayFn<ColProps & DivProps, [utils: MenuController<T>]>
    menuTrigger?: MayFn<DivProps, [utils: MenuController<T>]>
    menuItemBox?: MayFn<DivProps, [utils: MenuController<T>]>
    letAddFloatBgOptions?: MayFn<LetAddFloatBgOptions, [utils: MenuController<T>]>
  }
}

export const Menu = createKit(
  { name: 'Menu', plugin: [letMenuStyle, letHandleMenuKeyboardShortcut] },
  <T extends any>({
    menuItems,
    defaultMenuItem,
    onChange,
    getKey,
    controller,
    componentId,
    renderLabel,
    anatomy,
    ...divProps
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
      <Popover
        placement='bottom'
        renderButton={
          <AddProps {...divProps}>
            <Div shadowProps={shrinkToValue(anatomy?.menuTrigger, [innerController])}>Open</Div>
          </AddProps>
        }
        renderPanel={
          <AddProps {...divProps}>
            <Col
              plugin={letAddFloatBg({
                ...shrinkToValue(anatomy?.letAddFloatBgOptions, [innerController]),
                activeItemIndex: getCurrent()
              })}
              icss={{ width: '120px', background: '#999', padding: '48px', boxShadow: '#9a9a9a33 2px 4px 8px' }}
              shadowProps={shrinkToValue(anatomy?.panel, [innerController])}
            >
              <For each={menuItems} getKey={getKey}>
                {(menu) => (
                  <Div
                    shadowProps={shrinkToValue(anatomy?.menuItemBox, [innerController])}
                    onClick={() => {
                      setActiveMenu(menu)
                    }}
                  >
                    {shrinkToValue(renderLabel, [{ menu, ...innerController }]) ?? String(menu)}
                  </Div>
                )}
              </For>
            </Col>
          </AddProps>
        }
      />
    )
  }
)
