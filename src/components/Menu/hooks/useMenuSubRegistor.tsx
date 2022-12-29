import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { DivProps } from '../../../Div'
import { useRecordedEffect } from '../../../hooks'
import { LetAddFloatBgOptions } from '../../../plugins'
import { RowProps } from '../../Row'
import { MenuCoreProps } from '../index'
import { MenuController } from './useMenuControllerRegister'

export type MenuSubRegistor<T> = {
  renderLabel?: MayFn<ReactNode, [utils: { menu: T } & MenuController<T>]>
  anatomy?: {
    panel?: MayFn<RowProps, [utils: MenuController<T>]>
    menuTrigger?: MayFn<DivProps, [utils: MenuController<T>]>
    menuItemBox?: MayFn<DivProps, [utils: MenuController<T>]>
    letAddFloatBgOptions?: MayFn<LetAddFloatBgOptions, [utils: MenuController<T>]>
  }
}

export function useMenuSubRegistor<T>({
  controller,
  props: { anatomy, renderLabel }
}: {
  controller: MenuController<T>
  props: MenuCoreProps<T>
}) {
  return {
    renderFnNodes: {
      label: (menu: T) => shrinkToValue(renderLabel, [{ menu, ...controller }]) ?? String(menu)
    },
    anatomyProps: {
      panel: shrinkToValue(anatomy?.panel, [controller]),
      menuTrigger: shrinkToValue(anatomy?.menuTrigger, [controller]),
      menuItemBox: shrinkToValue(anatomy?.menuItemBox, [controller]),
      letAddFloatBgOptions: shrinkToValue(anatomy?.letAddFloatBgOptions, [controller])
    }
  }
}
