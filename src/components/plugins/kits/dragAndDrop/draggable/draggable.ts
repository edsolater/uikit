/** 拖动节点的节点算法。
 *
 * 在配置时准备拖动状态与完整控制入口，节点接入时建立 Pointer 拖动事务。
 *
 * 页面内匹配使用组合构建的内部身份；独立调用时内部身份为 undefined。
 */
import { createState, type State } from '@/foundation'
import { createToggle } from '@/hooks'
import {
  defineInactivePlugin,
  type PluginCoreContext,
} from '@/components/plugins/tools/defineInactivePlugin'
import { createPointerDrag, type PointerDrag } from './createPointerDrag'
import './draggable.style'

export interface DraggableOptions {
  /** 当前拖动携带的数据包。 */
  payload: unknown
  disabled?: boolean
  /** 指针移动多少 CSS px 后开始拖动，默认 0。 */
  activationDistance?: number
  /** 激活时是否立即承接阈值前累计的位移，默认 true。 */
  activationJump?: boolean
}

export interface DraggableController {
  /** 当前是否允许开始新的拖动。 */
  enabled: State<boolean>
  /** 已越过激活距离，并且本次拖动尚未结束或取消。 */
  dragging: State<boolean>
  enable(): void
  /** 禁止新的拖动，并立即取消正在进行的拖动。 */
  disable(): void
}

/**
 * 配置拖动能力；Pointer 事务在元素接入时建立，节点退出时取消并释放。
 */
export function draggablePluginCore({
  pluginOptions,
  addProps,
  withDom,
  id,
}: PluginCoreContext<DraggableOptions>): DraggableController {
  const [enabled, enabledControl] = createToggle(
    !(pluginOptions.disabled ?? false),
  )
  const dragging = createState(false)
  let pointerDrag: PointerDrag | undefined

  withDom((el) => {
    pointerDrag = createPointerDrag({
      source: el,
      id,
      payload: pluginOptions.payload,
      activationDistance: Math.max(0, pluginOptions.activationDistance ?? 0),
      activationJump: pluginOptions.activationJump ?? true,
      enabled: enabled.read,
      onDraggingChange: (value) => dragging.set(value),
    })
    return () => {
      pointerDrag?.cancel()
      pointerDrag = undefined
    }
  })

  addProps({
    htmlProps: { 'draggable': false, 'data-plugin': { mergable: 'draggable' } },
    on: {
      dragstart: {
        passive: false,
        callback: ({ preventDefault }) => preventDefault(),
      },
      pointerdown: {
        passive: false,
        callback: ({ event }) => pointerDrag?.start(event),
      },
    },
  })

  return {
    enabled,
    dragging,
    enable: enabledControl.turnOn,
    disable() {
      enabledControl.turnOff()
      pointerDrag?.cancel()
    },
  }
}

/** 拖动能力的单元定义；在组件内配置调用时构建一份能力结果。 */
export const draggable = defineInactivePlugin({
  name: 'draggable',
  pluginCore: draggablePluginCore,
})
