/** 拖动节点的节点算法。
 *
 * 在当前节点安装 Pointer 拖动，并返回该节点的拖动功能。
 *
 * 复用已有拖动事务，按共享 id 匹配接收目标。
 */
import { createState, type State } from '@/foundation'
import { createToggle } from '@/hooks'
import type { PluginContext } from '@/components/plugins/defineInactivePlugin'
import { createPointerDrag } from './createPointerDrag'
import { defineInactivePlugin } from '@/components/plugins/defineInactivePlugin'
import './draggable.style'

export interface DraggableOptions {
  /** 与接收节点共享的组标识；双方未提供时也可协作。 */
  id?: object
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
 * 给当前节点安装拖动；关闭能力会取消进行中的拖动。
 */
export function draggablePluginCore({
  pluginOptions,
  element,
  onCleanup,
  addProps,
}: PluginContext & { pluginOptions: DraggableOptions }): DraggableController {
  const [enabled, enabledControl] = createToggle(
    !(pluginOptions.disabled ?? false),
  )
  const dragging = createState(false)
  const pointerDrag = createPointerDrag({
    source: element,
    id: pluginOptions.id,
    payload: pluginOptions.payload,
    activationDistance: Math.max(0, pluginOptions.activationDistance ?? 0),
    activationJump: pluginOptions.activationJump ?? true,
    enabled: enabled.read,
    onDraggingChange: (value) => dragging.set(value),
  })
  onCleanup(pointerDrag.cancel)
  addProps({
    htmlProps: { 'draggable': false, 'data-plugin': { mergable: 'draggable' } },
    on: {
      dragstart: {
        passive: false,
        callback: ({ preventDefault }) => preventDefault(),
      },
      pointerdown: {
        passive: false,
        callback: ({ event }) => pointerDrag.start(event),
      },
    },
  })
  return {
    enabled,
    dragging,
    enable: enabledControl.turnOn,
    disable() {
      enabledControl.turnOff()
      pointerDrag.cancel()
    },
  }
}

/** 创建供节点执行的拖动 Plugin。 */
export const draggable = defineInactivePlugin({
  name: 'draggable',
  pluginCore: draggablePluginCore,
})
