/**
 * Draggable Plugin：把 Piv 接入页面内 Pointer 拖动。
 *
 * 【职责边界】公开启停与拖动状态；指针事务、视觉副本和 Droppable 命中由内部设施完成。
 */
import { onCleanup } from 'solid-js'
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'
import { createPointerDrag } from './createPointerDrag'
import './draggable.css'

export interface DraggableOptions {
  /** 当前拖动携带的数据包。 */
  payload: unknown
  disabled?: boolean
  /** 指针移动多少 CSS px 后开始拖动，默认 6。 */
  activationDistance?: number
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

const defaultActivationDistance = 6

export const draggable = createPlugin<DraggableOptions, DraggableController, PivTag>((options) => {
  const [enabled, enabledControl] = createToggle(!(options?.disabled ?? false))
  const [dragging, draggingControl] = createToggle(false)
  let cancelDrag: (() => void) | undefined

  const controller: DraggableController = {
    enabled,
    dragging,
    enable: enabledControl.turnOn,
    disable() {
      enabledControl.turnOff()
      cancelDrag?.()
    },
  }

  return {
    controller,
    plugin: ({ element }) => {
      const pointerDrag = createPointerDrag({
        source: element,
        payload: options?.payload,
        activationDistance: Math.max(
          0,
          options?.activationDistance ?? defaultActivationDistance,
        ),
        enabled: enabled.read,
        onDraggingChange(dragging) {
          if (dragging) draggingControl.turnOn()
          else draggingControl.turnOff()
        },
      })
      cancelDrag = pointerDrag.cancel
      onCleanup(() => {
        pointerDrag.cancel()
        if (cancelDrag === pointerDrag.cancel) cancelDrag = undefined
      })

      return {
        htmlProps: {
          draggable: false,
          'data-plugin': { mergable: 'draggable' },
          'data-dragging': dragging,
        },
        on: {
          dragstart: {
            passive: false,
            callback: ({ preventDefault }) => preventDefault(),
          },
          pointerdown: {
            passive: false,
            callback: ({ event }) => pointerDrag.start(event),
          },
          pointermove: {
            passive: false,
            callback: ({ event }) => pointerDrag.move(event),
          },
          pointerup: {
            passive: false,
            callback: ({ event }) => pointerDrag.finish(event),
          },
          pointercancel: ({ event }) => pointerDrag.cancel(event),
          lostpointercapture: ({ event }) => pointerDrag.cancel(event),
        },
      }
    },
  }
})
