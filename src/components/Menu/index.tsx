import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useEvent, useRecordedEffect, useStatusRef } from '../../hooks'
import { letAddFloatBg, LetAddFloatBgOptions } from '../../plugins'
import { Plugin } from '../../plugins/type'
import { StatusRef } from '../../typings/tools'
import { AddProps } from '../AddProps'
import { Col, ColProps } from '../Col'
import { For } from '../For'
import { Popover } from '../Popover/Popover'
import { useKitProps } from '../utils'
import { letHandleMenuKeyboardShortcut } from './plugins/letHandleMenuKeyboardShortcut'
import { letMenuStyle } from './plugins/letMenuStyle'

export type MenuStatus<T> = {
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

  // -------- plugins and shadowProps--------
  plugin?: MayDeepArray<Plugin<any /* too difficult to type */>>
  shadowProps?: MayDeepArray<Partial<MenuProps<T>>> // component must merged before `<Div>`

  // -------- selfComponent --------
  statusRef?: MayDeepArray<StatusRef<MenuStatus<T>>>
  componentId?: string

  // -------- sub --------
  renderLabel?: MayFn<ReactNode, [utils: { menu: T } & MenuStatus<T>]>
  anatomy?: {
    panel?: MayFn<ColProps & DivProps, [utils: MenuStatus<T>]>
    menuTrigger?: MayFn<DivProps, [utils: MenuStatus<T>]>
    menuItemBox?: MayFn<DivProps, [utils: MenuStatus<T>]>
    letAddFloatBgOptions?: MayFn<LetAddFloatBgOptions, [utils: MenuStatus<T>]>
  }
}

export function Menu<T extends any>(inputProps: MenuProps<T>) {
  const [props, divProps] = useKitProps(inputProps, { plugin: [letHandleMenuKeyboardShortcut, letMenuStyle] })
  const [activeMenu, setActiveMenu] = useState(props.defaultMenuItem)
  const getCurrent = useEvent(() => activeMenu && props.menuItems.indexOf(activeMenu))
  const innerController: MenuStatus<T> = {
    activeMenu,
    activeMenuIndex: getCurrent(),
    toNext() {
      const current = getCurrent()
      const next = current != null ? current + 1 : 0
      setActiveMenu(props.menuItems.at(next % props.menuItems.length))
    },
    toPrev() {
      const current = getCurrent()
      const prev = current != null ? current - 1 : 0
      setActiveMenu(props.menuItems.at(prev))
    },
    toFirst() {
      setActiveMenu(props.menuItems.at(0))
    },
    toLast() {
      setActiveMenu(props.menuItems.at(-1))
    },
    to(index) {
      setActiveMenu(props.menuItems.at(index))
    },
    toMenu(menu) {
      setActiveMenu(menu)
    }
  }

  useRecordedEffect(
    ([prevActiveMenu]) => {
      if (activeMenu && activeMenu != prevActiveMenu) props.onChange?.(activeMenu)
    },
    [activeMenu]
  )

  if (props.statusRef) useStatusRef(props.componentId, props.statusRef, innerController)
  return (
    <Popover
      placement='bottom'
      renderButton={
        <AddProps {...divProps}>
          <Div shadowProps={shrinkToValue(props.anatomy?.menuTrigger, [innerController])}>Open</Div>
        </AddProps>
      }
      renderPanel={
        <AddProps {...divProps}>
          <Col
            plugin={letAddFloatBg({
              ...shrinkToValue(props.anatomy?.letAddFloatBgOptions, [innerController]),
              activeItemIndex: getCurrent()
            })}
            icss={{ width: '120px', background: '#999', padding: '48px', boxShadow: '#9a9a9a33 2px 4px 8px' }}
            shadowProps={shrinkToValue(props.anatomy?.panel, [innerController])}
          >
            <For each={props.menuItems} getKey={props.getKey}>
              {(menu) => (
                <Div
                  shadowProps={shrinkToValue(props.anatomy?.menuItemBox, [innerController])}
                  onClick={() => {
                    setActiveMenu(menu)
                  }}
                >
                  {shrinkToValue(props.renderLabel, [{ menu, ...innerController }]) ?? String(menu)}
                </Div>
              )}
            </For>
          </Col>
        </AddProps>
      }
    />
  )
}
