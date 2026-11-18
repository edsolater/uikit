/** 拖动节点的节点算法。
 *
 * 在配置时准备拖动状态与完整控制入口，节点接入时建立 Pointer 拖动事务。
 *
 * 页面内匹配使用组合构建的内部身份；独立调用时内部身份为 undefined。
 */
import { createState, val, type State } from '@/foundation'
import { createToggle } from '@/hooks'
import {
  createInactivePlugin,
  type PluginCoreContext,
} from '../../../tools/createInactivePlugin'
import { createPointerDrag, type PointerDrag } from './pointer-drag'
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
  /** 正在拖动 */
  dragging: State<boolean>
  enable(): void
  /** 禁用拖动 */
  disable(): void
}

/**
 * 配置拖动能力；首次取得节点后建立 Pointer 事务，构建作用域退出时取消并释放。
 */
export function draggablePluginCore({
  pluginOptions: options,
  addProps,
  id,
}: PluginCoreContext<DraggableOptions>): DraggableController {
  // 准备启用开关与拖动状态，供交互判断和外部 Controller 共用。
  const [enabled, enabledControl] = createToggle(!(options.disabled ?? false))

  // 状态记录:正在拖动
  const dragging = createState(false)

  let pointerDrag: PointerDrag | undefined

  // 触发交给 浏览器DOM，但关闭浏览器原生拖放。
  addProps({
    // DOM 绑定拥有会话；卸载或换节点时先取消该节点仍在进行的交互。
    domRef: target => {
      const session = createPointerDrag({
        target,
        id,
        payload: options.payload,
        activationDistance: Math.max(0, options.activationDistance ?? 0),
        activationJump: options.activationJump ?? true,
        enabled: () => val(enabled),
        onDraggingChange: value => dragging.set(value),
      })
      pointerDrag = session
      return () => {
        session.cancel()
        pointerDrag = undefined
      }
    },
    htmlProps: { 'draggable': false, 'data-plugin': { mergable: 'draggable' } },
    on: {
      dragstart: {
        passive: false,
        callback: ({ preventDefault }) => preventDefault(),
      },
      pointerdown: {
        passive: false,
        callback: ({ event }) => {
          pointerDrag!.start(event)
        },
      },
    },
  })

  // 暴露出：状态感知器、能力
  return {
    enabled,
    dragging,
    enable: enabledControl.turnOn,
    /**
     * 禁止后续拖动，并同步取消当前事务。
     */
    disable() {
      enabledControl.turnOff()
      pointerDrag?.cancel()
    },
  }
}

/** 拖动能力的单元定义；在组件内配置调用时构建一份能力结果。 */
export const draggable = createInactivePlugin({
  name: 'draggable',
  pluginCore: draggablePluginCore,
})
