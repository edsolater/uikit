/** 接收节点的节点算法。
 *
 * 接入现有内部拖放与外部文件监听，并返回节点接收功能。
 *
 * 页面内材料按共享 id 配对，外部材料由目标的启用状态和 accepts 判断。
 */
import { createState, type State } from '@/foundation'
import { createToggle } from '@/hooks'
import type { PluginContext } from '@/components/plugins/tools/defineInactivePlugin'
import { registerInternalDropTarget } from '@/components/plugins/kits/dragSession'
import { createExternalDropListeners } from './createExternalDropListeners'
import { createInternalDropContext, type DropContext } from './dropContext'
import { defineInactivePlugin } from '@/components/plugins/tools/defineInactivePlugin'

export interface DroppableOptions {
  /** 与拖动节点共享的组标识。 */
  id?: object
  disabled?: boolean
  /** 只作用于系统外部原生拖放。 */
  dropEffect?: DataTransfer['dropEffect']
  /** 判断当前内部材料或外部 DataTransfer 是否可以放下。 */
  accepts?: (context: DropContext) => boolean
  /** 目标启用且 accepts 通过后调用；页面内材料还须匹配 id。 */
  onDrop?: (context: DropContext) => void
}

export interface DroppableController {
  /** 当前是否参与命中与接收。 */
  enabled: State<boolean>
  /** 指针或外部材料当前位于目标上方，包括不可接收的情况。 */
  hovering: State<boolean>
  /** 当前悬停材料是否可接收；页面内材料还须匹配 id。 */
  acceptable: State<boolean>
  enable(): void
  /** 停止接收，并清除当前悬停状态。 */
  disable(): void
}

/**
 * 给当前节点安装接收行为，并在节点退出时释放登记。
 */
export function droppablePluginCore({
  pluginOptions,
  element,
  onCleanup,
  addProps,
}: PluginContext & { pluginOptions: DroppableOptions }): DroppableController {
  const [enabled, enabledControl] = createToggle(
    !(pluginOptions.disabled ?? false),
  )
  const hovering = createState(false)
  const acceptable = createState(false)
  const resetHover = () => {
    hovering.set(false)
    acceptable.set(false)
  }
  const showHover = (accepted: boolean) => {
    hovering.set(true)
    acceptable.set(accepted)
  }
  const acceptsDrop = (context: DropContext) =>
    enabled.read() && (pluginOptions.accepts?.(context) ?? true)
  const onDrop = (context: DropContext) => pluginOptions.onDrop?.(context)
  onCleanup(
    registerInternalDropTarget({
      element,
      id: pluginOptions.id,
      enabled: enabled.read,
      accepts: (drag, event) =>
        acceptsDrop(createInternalDropContext(drag, event, element)),
      hover: showHover,
      leave: resetHover,
      drop: (drag, event) =>
        onDrop(createInternalDropContext(drag, event, element)),
    }),
  )
  addProps({
    htmlProps: {
      'data-plugin': { mergable: 'droppable' },
      'data-drop-hovering': hovering,
      'data-drop-acceptable': acceptable,
    },
    on: createExternalDropListeners({
      element,
      dropEffect: pluginOptions.dropEffect,
      enabled: enabled.read,
      accepts: acceptsDrop,
      onDrop,
      showHover,
      resetHover,
    }),
  })
  return {
    enabled,
    hovering,
    acceptable,
    enable: enabledControl.turnOn,
    disable() {
      enabledControl.turnOff()
      resetHover()
    },
  }
}

/** 创建供节点执行的接收 Plugin。 */
export const droppable = defineInactivePlugin({
  name: 'droppable',
  pluginCore: droppablePluginCore,
})
