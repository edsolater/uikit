/** 拖放组合式 Kit。 */
import { defineInactivePlugins } from '@/components/plugins/tools/defineInactivePlugins'
import { draggablePluginCore } from '@/components/plugins/kits/dragAndDrop/draggable/draggable'
import { droppablePluginCore } from '@/components/plugins/kits/dragAndDrop/droppable/droppable'

/** 组织独立拖动与接收工厂，不隐含新连接。 */
export const dragAndDrop = defineInactivePlugins({
  draggable: draggablePluginCore,
  droppable: droppablePluginCore,
})
