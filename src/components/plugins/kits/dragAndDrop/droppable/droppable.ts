/** 接收节点的节点算法。
 *
 * 配置时准备接收状态与完整控制入口；元素接入时登记内部目标并接入外部材料监听。
 *
 * 页面内材料按组合构建的内部身份配对，外部材料由目标的启用状态和 accepts 判断。
 */
import { createState, type State } from '@/foundation'
import { createToggle } from '@/hooks'
import {
  defineInactivePlugin,
  type PluginCoreContext,
} from '@/components/plugins/tools/defineInactivePlugin'
import { registerInternalDropTarget } from '@/components/plugins/kits/dragSession'
import { createExternalDropListeners } from './createExternalDropListeners'
import { createInternalDropContext, type DropContext } from './dropContext'

export interface DroppableOptions {
  disabled?: boolean
  /** 只作用于系统外部原生拖放。 */
  dropEffect?: DataTransfer['dropEffect']
  /** 判断当前内部材料或外部 DataTransfer 是否可以放下。 */
  accepts?: (context: DropContext) => boolean
  /** 目标启用且 accepts 通过后调用；页面内材料还须匹配内部组身份。 */
  onDrop?: (context: DropContext) => void
}

export interface DroppableController {
  /** 当前是否参与命中与接收。 */
  enabled: State<boolean>
  /** 指针或外部材料当前位于目标上方，包括不可接收的情况。 */
  hovering: State<boolean>
  /** 当前悬停材料是否可接收；页面内材料还须匹配内部组身份。 */
  acceptable: State<boolean>
  enable(): void
  /** 停止接收，并清除当前悬停状态。 */
  disable(): void
}

/**
 * 配置接收能力；内部目标登记随元素接入建立，节点退出时释放。
 */
export function droppablePluginCore({
  pluginOptions,
  addProps,
  withDom,
  id,
}: PluginCoreContext<DroppableOptions>): DroppableController {
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

  withDom((el) =>
    registerInternalDropTarget({
      element: el,
      id,
      enabled: enabled.read,
      accepts: (drag, event) =>
        acceptsDrop(createInternalDropContext(drag, event, el)),
      hover: showHover,
      leave: resetHover,
      drop: (drag, event) =>
        onDrop(createInternalDropContext(drag, event, el)),
    }),
  )

  addProps({
    htmlProps: {
      'data-plugin': { mergable: 'droppable' },
      'data-drop-hovering': hovering,
      'data-drop-acceptable': acceptable,
    },
    on: createExternalDropListeners({
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

/** 接收能力的单元定义；在组件内配置调用时构建一份能力结果。 */
export const droppable = defineInactivePlugin({
  name: 'droppable',
  pluginCore: droppablePluginCore,
})
