import { useState } from 'react'
import { Div, DivProps } from '../../Div'
import { letAddFloatBg } from '../../plugins'
import { AddProps } from '../AddProps'
import { Col } from '../Col'
import { For } from '../For'
import { Popover } from '../Popover/Popover'
import { createKit } from '../utils'
import { MenuCallbackProps, useMenuCallbacksRegister } from './hooks/useMenuCallbacksRegister'
import { MenuControllerProps, useMenuControllerRegister } from './hooks/useMenuControllerRegister'
import { MenuSubRegistor, useMenuSubRegistor } from './hooks/useMenuSubRegistor'
import { letHandleMenuKeyboardShortcut } from './plugins/letHandleMenuKeyboardShortcut'
import { letMenuStyle } from './plugins/letMenuStyle'

export interface MenuCoreProps<T> extends MenuControllerProps<T>, MenuCallbackProps<T>, MenuSubRegistor<T> {
  menuItems: T[]
  defaultMenuItem?: T
  getKey: (menuItem: T) => string | number
}

export type MenuProps<T> = MenuCoreProps<T> & DivProps // can & plugin

export const Menu = createKit(
  'Menu',
  <T extends any>(props: MenuProps<T>) => {
    const { menuItems, defaultMenuItem, getKey, controller, componentId, renderLabel, anatomy, ...divProps } = props

    const [activeMenu, setActiveMenu] = useState(defaultMenuItem)
    const state = { activeMenu, setActiveMenu }

    const { innerController, getActiveItemIndex } = useMenuControllerRegister({ state, props })
    useMenuCallbacksRegister({ state, props })
    const { anatomyProps, renderFnNodes } = useMenuSubRegistor({ controller: innerController, props })

    return (
      <Popover
        placement='bottom'
        renderButton={
          <AddProps {...divProps}>
            <Div shadowProps={anatomyProps.menuTrigger}>Open</Div>
          </AddProps>
        }
        renderPanel={
          <AddProps {...divProps}>
            <Col
              plugin={letAddFloatBg({
                ...anatomyProps.letAddFloatBgOptions,
                activeItemIndex: getActiveItemIndex()
              })}
              icss={{ width: '120px', background: '#999', padding: '48px', boxShadow: '#9a9a9a33 2px 4px 8px' }}
              shadowProps={anatomyProps.panel}
            >
              <For each={menuItems} getKey={getKey}>
                {(menu) => (
                  <Div
                    shadowProps={anatomyProps.menuItemBox}
                    onClick={() => {
                      setActiveMenu(menu)
                    }}
                  >
                    {renderFnNodes.label(menu)}
                  </Div>
                )}
              </For>
            </Col>
          </AddProps>
        }
      />
    )
  },
  { plugin: [letMenuStyle, letHandleMenuKeyboardShortcut] }
)
