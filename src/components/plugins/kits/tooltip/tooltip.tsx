/**
 * 实际宿主的补充提示插件。
 *
 * 复用 Popover 双端能力显示辅助信息，拥有跨宿主／正文的阅读交互。
 *
 * 使Label问号及其他宿主共用同一提示能力。
 */
import { IdGenerator } from '@edsolater/fnkit'
import { createComponent, createEffect, onCleanup, Show, withDefault, val } from '@/foundation'
import { createInactivePlugin } from '@/components/plugins/tools/createInactivePlugin'
import { createPivStructure } from '@/components/Piv/plugin/helpers'
import { Piv, type PivProps } from '../../../Piv/Piv'
import {
  createPopoverPlugins,
  type PopoverBodyOptions,
  type PopoverController,
} from '@/components/plugins/kits/Popover/popover'
import './tooltip.style'

/** 字符串或组件模板及其Source；内容含义由调用方决定。 */
export type TooltipOptions = {
  content: PivProps['children']
  /** 提示相对宿主的方向，默认 top。 */
  $anchorPosition?: PopoverBodyOptions['$anchorPosition']
  /** 宿主与提示的间距档位，默认 md。 */
  $anchorGap?: PopoverBodyOptions['$anchorGap']
}
/** 仅公开打开状态与显示关闭操作，不冒充宿主的DOM身份。 */
export type TooltipController = {
  /** Popover 的原生打开状态。 */
  isOpen: PopoverController['isOpen']
  /**
   * 显示现有内容并取消延迟关闭。
   */
  showPopover: () => void
  /**
   * 关闭提示并取消延迟关闭，不主动移动焦点。
   */
  hidePopover: () => void
}

const tooltipIdGenerator = new IdGenerator('uikit-tooltip')

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
 *
 * 附属结构与离开关闭计时归构建作用域；浮层内容仍由原Source持续更新。
 * @example <Text is={tooltip({ content: '补充说明' })}>正文</Text>
 */
export const tooltip = createInactivePlugin<TooltipOptions, TooltipController>({
  name: 'tooltip',
  pluginCore({
    pluginOptions: options,
    addProps,
    domProxy,
  }): TooltipController {
    const tooltipId = `uikit-tooltip-${tooltipIdGenerator.genID()}`
    const { plugins, controller } = createPopoverPlugins({
      trigger: { triggerAction: false },
      body: {
        popover: 'hint',
        autoFocus: false,
        $anchorPosition: withDefault(options.$anchorPosition, 'top'),
        $anchorGap: withDefault(options.$anchorGap, 'md'),
      },
    })
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
      // TODO：浮层未插入时 showPopover 可能失败；交由 [Task](../../../../../docs/todo/261107_Task与TaskResult异步操作.md) 等待就绪并支持取消。
      if (hasTooltipContent(options.content)) controller.showPopover()
    }
    /**
     * 离开阅读区域后延迟关闭，保留跨越浮层间距的机会。
     */
    const leave = () => {
      cancelClose()
      hovered = false
      if (!focused) {
        closeTimer = setTimeout(controller.hidePopover, 150)
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
      controller.hidePopover()
    }
    onCleanup(cancelClose)
    // 内容清空时读取原生关闭结果；移出 document 本身不一定派发 toggle。
    createEffect(() => hasTooltipContent(options.content), (present) => {
      if (!present) dismiss()
    })
    // 一次构建同一正文节点，内容清空只移出 document，恢复时仍使用原配对。
    const body = createComponent<PivProps>(Piv, {
      is: plugins.body,
      id: tooltipId,
      class: 'Tooltip',
      htmlProps: { role: 'tooltip' },
      on: { pointerenter: enter, pointerleave: leave },
      get children() { return options.content },
    })
    const { insertAfter } = createPivStructure(domProxy)
    insertAfter(
      <Show when={hasTooltipContent(options.content)}>{body}</Show>,
    )
    addProps({
      is: plugins.trigger,
      htmlProps: { 'aria-describedby': tooltipId },
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
    })
    return {
      isOpen: controller.isOpen,
      showPopover: open,
      hidePopover: dismiss,
    }
  },
})
