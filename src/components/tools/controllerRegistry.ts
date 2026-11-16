/** 保存当前存活的组件控制器，分别交付集合访问入口和登记能力。 */
import {
  createVirtualBatchAccessor,
  type VirtualBatchAccessor,
} from '@edsolater/fnkit'
import type { Token } from '@/style-system'

/** 实例集合的成员协议与可选样式 Token 集合。 */
export interface ControllerRegistryConfig {
  controller: unknown
  styleTokens?: unknown
}

/** Token 声明按原条件分配；undefined 分支不声明 style 命名空间。 */
type ControllerRegistryStyle<StyleTokens> = StyleTokens extends undefined
  ? {}
  : { style: StyleTokens }

/** 根 style 专用于原 Token 命名空间；未声明 styleTokens 时不增加该入口。 */
export type ControllerRegistry<Config extends ControllerRegistryConfig> =
  Omit<VirtualBatchAccessor<Config['controller']>, 'style'> &
    ControllerRegistryStyle<
      'styleTokens' extends keyof Config ? Config['styleTokens'] : undefined
    >

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
    accessor as ControllerRegistry<{
      controller: Controller
      styleTokens: Style
    }>,
    registry,
  ] as const
}
