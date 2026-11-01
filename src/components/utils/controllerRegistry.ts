/** 保存当前存活的组件控制器，分别交付集合访问入口和登记能力。 */
import {
  createVirtualBatchAccessor,
  type VirtualBatchAccessor,
} from '@edsolater/fnkit'
import type { Token } from '@/style-system'

/** 根 style 专用于原 Token 命名空间；数组与其它成员访问保留原协议。 */
export type ControllerCollection<Controller, Style = undefined> = Omit<
  VirtualBatchAccessor<Controller>,
  'style'
> &
  (Style extends undefined ? {} : { style: Style })

/** 公开使用访问器的 style 前，由组件登记原样式 Token 集合。 */
export function createControllerRegistry<
  Controller,
  Style extends Record<string, Token> | undefined = undefined,
>() {
  const controllers = new Set<Controller>()
  const accessor = createVirtualBatchAccessor(controllers)
  const registry = {
    /** 将原样式 Token 集合登记到同一访问入口。 */
    addStyleTokens(styleTokens: NonNullable<Style>): void {
      Reflect.set(accessor, 'style', styleTokens)
    },
    register(controller: Controller) {
      controllers.add(controller)
      return () => {
        controllers.delete(controller)
      }
    },
  }
  return [
    accessor as ControllerCollection<Controller, Style>,
    registry,
  ] as const
}
