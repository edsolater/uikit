/** 保存当前存活的组件控制器，分别交付集合访问入口和登记能力。 */
import {
  createVirtualBatchAccessor,
  type VirtualBatchAccessor,
} from '@edsolater/fnkit'
import type { Token } from '@/style-system'

/** 公开使用访问器的 style 前，由组件登记原样式 Token 集合。 */
export function createControllerRegistry<Controller>() {
  const controllers = new Set<Controller>()
  const accessor = createVirtualBatchAccessor(
    controllers,
  ) as VirtualBatchAccessor<Controller> & {
    style: Record<string, Token>
  }
  const registry = {
    /** 将原样式 Token 集合登记到同一访问入口。 */
    addStyleTokens(styleTokens: Record<string, Token>): void {
      accessor.style = styleTokens
    },
    register(controller: Controller) {
      controllers.add(controller)
      return () => {
        controllers.delete(controller)
      }
    },
  }
  return [accessor, registry] as const
}
