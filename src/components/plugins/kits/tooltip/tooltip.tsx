/**
 * 实际宿主的补充提示插件。
 *
 * 通过PopoverSurface显示辅助信息，拥有跨宿主／浮层的阅读交互。
 *
 * 使Label问号及其他宿主共用同一提示能力。
 */
import { onCleanup, Show, val } from '@/foundation'
import { createPlugin } from '../../definePlugin'
import type { PivTag } from '../../../Piv/domMap'
import type { PivProps } from '../../../Piv/Piv'
import {
  createPopoverVisibilityController,
  type PopoverVisibilityController,
} from '@/components/Popover/createPopoverVisibilityController'
import { PopoverSurface } from '@/components/Popover/PopoverSurface'
import './tooltip.style'

/** 字符串或组件模板及其Source；内容含义由调用方决定。 */
export type TooltipOptions = { content: PivProps['children'] }
/** 仅公开打开状态与显示关闭操作，不冒充宿主的DOM身份。 */
export type TooltipController = {
  isOpen: PopoverVisibilityController['isOpen']
  showPopover: () => void
  hidePopover: () => void
}

/**
 * 判断提示是否有可读内容，保留数字0；空值和空字符串不产生提示。
 */
export function hasTooltipContent(source: TooltipOptions['content']) {
  const content = val(source)
  return (
    content !== undefined &&
    content !== null &&
    typeof content !== 'boolean' &&
    content !== ''
  )
}

/**
 * 沿Piv实例挂载附属浮层，保留宿主原有id与声明优先级。
 */
export const tooltip = createPlugin<TooltipOptions, TooltipController, PivTag>(
  (options) => {
    const [controller, bindings] = createPopoverVisibilityController()
    const anchor = '--' + controller.triggerId
    let hovered = false
    let focused = false
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    /**
     * 取消尚未执行的离开关闭动作。
     */
    const cancelClose = () => clearTimeout(closeTimer)
    /**
     * 当前仍有提示内容时显示，同时取消旧关闭动作。
     */
    const open = () => {
      cancelClose()
      if (hasTooltipContent(options?.content)) controller.showPopover()
    }
    /**
     * 离开阅读区域后延迟关闭，保留跨越浮层间距的机会。
     */
    const leave = () => {
      hovered = false
      if (!focused) {
        closeTimer = setTimeout(() => controller.hidePopover(false), 150)
      }
    }
    /**
     * 进入任一阅读区域，显示并取消关闭。
     */
    const enter = () => {
      hovered = true
      open()
    }
    /**
     * 关闭并保留焦点，取消尚未执行的离开动作。
     */
    const dismiss = () => {
      cancelClose()
      controller.hidePopover(false)
    }
    onCleanup(cancelClose)
    return {
      controller: {
        isOpen: controller.isOpen,
        showPopover: open,
        hidePopover: dismiss,
      },
      plugin: ({ insertAfter }) => {
        insertAfter(
          <Show when={hasTooltipContent(options?.content)}>
            {(_visible) => {
              onCleanup(() => {
                cancelClose()
                controller.hidePopover(false)
              })
              return (
                <PopoverSurface
                  id={controller.popoverId}
                  anchor={anchor}
                  placement="top"
                  popover="hint"
                  class="Tooltip"
                  domRef={bindings.popoverDomRef}
                  htmlProps={{ role: 'tooltip' }}
                  on={{ pointerenter: enter, pointerleave: leave }}
                >
                  {options?.content}
                </PopoverSurface>
              )
            }}
          </Show>,
        )
        return {
          domRef: bindings.triggerDomRef,
          style: { 'anchor-name': anchor },
          htmlProps: { 'aria-describedby': controller.popoverId },
          on: {
            pointerenter: enter,
            pointerleave: leave,
            focusin: () => {
              focused = true
              open()
            },
            focusout: () => {
              focused = false
              if (!hovered) leave()
            },
            click: open,
            keydown: ({ event }) => {
              if (event.key === 'Escape') dismiss()
            },
          },
        }
      },
    }
  },
)
