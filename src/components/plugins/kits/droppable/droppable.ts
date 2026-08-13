/**
 * Droppable Plugin：统一接收页面内 Pointer 拖动与系统外部原生拖放。
 *
 * 【职责边界】公开接收判断、放下回调和悬停状态；两类输入在内部归一为 DropContext。
 */
import { onCleanup } from 'solid-js'
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'
import { registerInternalDropTarget } from '../dragAndDrop'
import { createExternalDropListeners } from './createExternalDropListeners'
import { createInternalDropContext, type DropContext } from './dropContext'

export type {
  DropContext,
  ExternalDropContext,
  InternalDropContext,
} from './dropContext'

export interface DroppableOptions {
  disabled?: boolean
  /** 只作用于系统外部原生拖放。 */
  dropEffect?: DataTransfer['dropEffect']
  /** 判断当前内部材料或外部 DataTransfer 是否可以放下。 */
  accepts?: (context: DropContext) => boolean
  /** 只在目标启用，并且 Scope 与 accepts 均通过后调用。 */
  onDrop?: (context: DropContext) => void
}

export interface DroppableController {
  /** 当前是否参与命中与接收。 */
  enabled: State<boolean>
  /** 指针或外部材料当前位于目标上方，包括不可接收的情况。 */
  hovering: State<boolean>
  /** 当前悬停材料是否同时通过 Scope 与 accepts 判断。 */
  acceptable: State<boolean>
  enable(): void
  /** 停止接收，并清除当前悬停状态。 */
  disable(): void
}

export const droppable = createPlugin<DroppableOptions, DroppableController, PivTag>((options) => {
  const [enabled, enabledControl] = createToggle(!(options?.disabled ?? false))
  const [hovering, hoveringControl] = createToggle(false)
  const [acceptable, acceptableControl] = createToggle(false)

  const resetHover = () => {
    hoveringControl.turnOff()
    acceptableControl.turnOff()
  }
  const showHover = (accepted: boolean) => {
    hoveringControl.turnOn()
    if (accepted) acceptableControl.turnOn()
    else acceptableControl.turnOff()
  }
  const acceptsDrop = (context: DropContext): boolean => (
    enabled.read() && (options?.accepts?.(context) ?? true)
  )
  const onDrop = (context: DropContext) => options?.onDrop?.(context)
  const controller: DroppableController = {
    enabled,
    hovering,
    acceptable,
    enable: enabledControl.turnOn,
    disable() {
      enabledControl.turnOff()
      resetHover()
    },
  }

  return {
    controller,
    plugin: ({ element }) => {
      const removeInternalTarget = registerInternalDropTarget({
        element,
        enabled: enabled.read,
        accepts: (drag, event) => acceptsDrop(createInternalDropContext(drag, event, element)),
        hover: showHover,
        leave: resetHover,
        drop: (drag, event) => onDrop(createInternalDropContext(drag, event, element)),
      })
      onCleanup(removeInternalTarget)

      return {
        htmlProps: {
          'data-plugin': { mergable: 'droppable' },
          'data-drop-hovering': hovering,
          'data-drop-acceptable': acceptable,
        },
        on: createExternalDropListeners({
          element,
          dropEffect: options?.dropEffect,
          enabled: enabled.read,
          accepts: acceptsDrop,
          onDrop,
          showHover,
          resetHover,
        }),
      }
    },
  }
})
