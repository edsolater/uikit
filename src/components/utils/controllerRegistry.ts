/** 保存当前存活的组件控制器，通过集合代理统一映射属性和方法。 */
import { createVirtualBatchAccessor } from '@edsolater/fnkit'

export function createControllerRegistry<Controller>() {
  const controllers = new Set<Controller>()
  return {
    all: createVirtualBatchAccessor(controllers),
    register(controller: Controller) {
      controllers.add(controller)
      return () => {
        controllers.delete(controller)
      }
    },
  }
}
