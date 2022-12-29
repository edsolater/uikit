import { MayDeepArray } from '@edsolater/fnkit'
import { useControllerRegister, useEvent } from '../../../hooks'
import { ControllerRef } from '../../../typings/tools'
import { MenuCoreProps } from '../index'

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

export type MenuControllerProps<T> = {
  controller?: MayDeepArray<ControllerRef<MenuController<T>>>
  componentId?: string
}

export function useMenuControllerRegister<T>({
  state: { activeMenu, setActiveMenu },
  props: { menuItems, componentId, controller }
}: {
  state: { activeMenu: T | undefined; setActiveMenu: React.Dispatch<React.SetStateAction<T | undefined>> }
  props: MenuCoreProps<T>
}) {
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
  if (controller) useControllerRegister(componentId, controller, innerController)

  return { innerController, getActiveItemIndex: getCurrent }
}
