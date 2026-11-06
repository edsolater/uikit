/** 拖放组合式 Kit。 */
import { defineInactivePlugins } from '@/components/plugins/tools/defineInactivePlugins'
import { draggablePluginCore } from '@/components/plugins/kits/dragAndDrop/draggable/draggable'
import { droppablePluginCore } from '@/components/plugins/kits/dragAndDrop/droppable/droppable'

/** 组织拖动与接收角色；每次组合调用在内部创建共享身份。 */
export const dragAndDrop = defineInactivePlugins({
  draggable: draggablePluginCore,
  droppable: droppablePluginCore,
})
