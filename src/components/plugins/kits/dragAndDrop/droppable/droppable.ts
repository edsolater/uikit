/** 接收节点的节点算法。
 *
 * 配置时准备接收状态与完整控制入口；元素接入时登记内部目标并接入外部材料监听。
 *
 * 页面内材料按组合构建的内部身份配对，外部材料由目标的启用状态和 accepts 判断。
 */
import { createState, type State } from '@/foundation'
import { createToggle } from '@/hooks'
import {
  createInactivePlugin,
  type PluginCoreContext,
} from '../../../tools/createInactivePlugin'
import { registerInternalDropTarget } from '../../dragSession'
import { createExternalDropListeners } from './external-drop-listeners'
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
 * 配置接收能力；内部目标在元素就绪后登记，构建作用域退出时释放。
 */
export function droppablePluginCore({
  pluginOptions: options,
  addProps,
  id,
}: PluginCoreContext<DroppableOptions>): DroppableController {
  const [enabled, enabledControl] = createToggle(!(options.disabled ?? false))
  const hovering = createState(false)
  const acceptable = createState(false)
  /**
   * 清空当前目标的悬停与接收状态。
   */
  const resetHover = () => {
    hovering.set(false)
    acceptable.set(false)
  }
  /**
   * 显示当前材料位于目标上方，并记录它是否可接收。
   */
  const showHover = (accepted: boolean) => {
    hovering.set(true)
    acceptable.set(accepted)
  }
  /**
   * 目标启用时按业务规则判断是否接收当前材料。
   */
  const acceptsDrop = (context: DropContext) =>
    enabled.read() && (options.accepts?.(context) ?? true)
  /**
   * 向业务交付已通过接收判断的放下材料。
   */
  const onDrop = (context: DropContext) => options.onDrop?.(context)

  // 声明外部拖放监听与状态。
  addProps({
    // 同步登记真实节点；绑定退出时注销并清空该目标的悬停状态。
    domRef: (target) => {
      const unregister = registerInternalDropTarget({
        target,
        id,
        enabled: enabled.read,
        accepts(drag, event) {
          return acceptsDrop(createInternalDropContext(drag, event, target))
        },
        hover: showHover,
        leave: resetHover,
        drop(drag, event) {
          onDrop(createInternalDropContext(drag, event, target))
        },
      })
      return () => {
        unregister()
        resetHover()
      }
    },
    htmlProps: {
      'data-plugin': { mergable: 'droppable' },
      'data-drop-hovering': hovering,
      'data-drop-acceptable': acceptable,
    },
    on: createExternalDropListeners({
      dropEffect: options.dropEffect,
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
    /**
     * 停止接收，并立即清空当前悬停。
     */
    disable() {
      enabledControl.turnOff()
      resetHover()
    },
  }
}

/** 接收能力的单元定义；在组件内配置调用时构建一份能力结果。 */
export const droppable = createInactivePlugin({
  name: 'droppable',
  pluginCore: droppablePluginCore,
})
