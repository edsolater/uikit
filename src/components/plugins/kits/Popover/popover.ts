/**
 * Popover 的成对节点能力。
 *
 * 负责连接触发节点与原生浮层，声明定位、显隐操作和状态；不提供正文或材料。
 * 使用方在实际按钮和内容节点上分别安装两个角色。
 */
import { IdGenerator, type PromiseResultProxy } from '@edsolater/fnkit'
import {
  createEffect,
  createState,
  onCleanup,
  stateView,
  toStateString,
  val,
  type Source,
  type State,
  type StateView,
} from '@/foundation'
import { defineInactivePlugins } from '@/components/plugins/tools/defineInactivePlugins'
import type { PluginCoreContext } from '@/components/plugins/tools/defineInactivePlugin'
import './popover.style'

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left'
export type PopoverToggleEvent = Event & {
  oldState: 'open' | 'closed'
  newState: 'open' | 'closed'
}

export interface PopoverTriggerOptions {
  triggerAction?: 'toggle' | 'show' | 'hide'
}

export interface PopoverBodyOptions {
  /** 主体相对锚点的方向，默认 bottom。 */
  anchorPosition?: Source<AnchorPosition | undefined>
  /** 锚点边缘到主体边缘的 CSS 长度，默认 4px。 */
  triggerMargin?: Source<string | undefined>
  popover?: 'auto' | 'hint' | 'manual'
  /** 首个完成的值决定是否默认打开一次；后续变化不重新初始化。 */
  defaultOpen?: Source<boolean | undefined>
  /** 打开时优先聚焦的 DOM 引用；省略时使用正文内首个可聚焦节点。Controller 和组件目标尚未支持。 */
  autoFocus?: Partial<HTMLElement>

  /** 浮层打开(后) */
  onOpen?: (event: PopoverToggleEvent) => void
  /** 浮层打开前 */
  onBeforeOpen?: (event: PopoverToggleEvent) => void
  /** 浮层关闭(后) */
  onClose?: (event: PopoverToggleEvent) => void
  /** 浮层关闭前 */
  onBeforeClose?: (event: PopoverToggleEvent) => void
  /** 浮层切换(后) */
  onToggle?: (open: boolean, event: PopoverToggleEvent) => void
  /** 浮层切换前 */
  onBeforeToggle?: (open: boolean, event: PopoverToggleEvent) => void
  // TODO：onProgress 尚未实现；需按需读取真实过渡进度，参数与进度汇总方式仍待确定。
  /**
   * TODO：定位翻面回调尚未实现，当前不会触发；参数类型暂为占位。
   * 浏览器已有 anchored fallback 条件查询，但没有直接的原生翻面通知事件。
   * 该 CSS 条件只能作用于容器后代和伪元素，不能依据自身查询修改容器自身。
   * 未来是否提供原生通知、何时提供尚不确定。
   * @see https://developer.chrome.com/blog/anchored-container-queries
   */
  onPopoverFlip?: (event: PopoverToggleEvent) => void
}

export interface PopoverNodeController {
  isOpen: State<boolean>
  /**
   * 显示本组浮层；操作配置尚待确定。
   * TODO: 操作结果未来由 Task Result 表达，目前尚未实现。
   * @example controller.showPopover()
   */
  showPopover(): void
  /**
   * 关闭本组浮层；焦点恢复遵循浏览器原生行为。
   * @example controller.hidePopover()
   */
  hidePopover(): void
  /**
   * 切换浮层；force 可指定打开或关闭。
   * @example controller.togglePopover({ force: false })
   */
  togglePopover(options?: { force?: boolean }): void
}

const popoverIdGenerator = new IdGenerator('uikit-popover')
// TODO：跨项目统一将 FNKit 的 mapGet 更名为 getOrInsert。
const popoverGroups = new WeakMap<
  object,
  ReturnType<typeof createPopoverGroup>
>()

/**
 * 为一次组合准备锚点名称和共享的打开状态。
 */
function createPopoverGroup() {
  const name = `uikit-popover-${popoverIdGenerator.genID()}`
  const isOpen = createState(false)
  return {
    anchor: name, // 使用时再坍缩成 --popover-anchor
    isOpen: isOpen,
    triggerTarget: undefined as PromiseResultProxy<HTMLElement> | undefined,
    bodyTarget: undefined as PromiseResultProxy<HTMLElement> | undefined,
  }
}

/**
 * 为单个角色提供完整显隐入口；打开状态由原生 toggle 更新。
 */
function createPopoverNodeController(
  group: ReturnType<typeof createPopoverGroup>,
): PopoverNodeController {
  return {
    isOpen: group.isOpen,
    /**
     * 请求显示本组浮层。
     */
    showPopover() {
      group.bodyTarget?.showPopover()
    },
    /**
     * 请求关闭本组浮层。
     */
    hidePopover() {
      group.bodyTarget?.hidePopover()
    },
    /**
     * 切换或指定打开状态。
     */
    togglePopover(options) {
      group.bodyTarget?.togglePopover(options?.force)
    },
  }
}

/**
 * 触发节点声明原生按钮行为和本组锚点。
 * 内容及按钮身份由使用方提供。
 */
function popoverTriggerCore({
  pluginOptions,
  addProps,
  domProxy,
  id,
}: PluginCoreContext<PopoverTriggerOptions>): PopoverNodeController {
  const group = popoverGroups.getOrInsertComputed(id!, createPopoverGroup)
  group.triggerTarget = domProxy
  addProps({
    style: { 'anchor-name': group.anchor },
    htmlProps: {
      'popovertargetaction': pluginOptions.triggerAction ?? 'toggle',
      'aria-expanded': toStateString(group.isOpen),
      'aria-haspopup': 'dialog',
    },
  })
  return createPopoverNodeController(group)
}

/**
 * 浮层节点声明原生 Popover、定位及状态事件。
 * 原生目标通过实际节点建立，不要求使用方传递共享 id。
 */
function popoverBodyCore({
  pluginOptions,
  addProps,
  domProxy,
  id,
}: PluginCoreContext<PopoverBodyOptions>): PopoverNodeController {
  const group = popoverGroups.getOrInsertComputed(id!, createPopoverGroup)
  group.bodyTarget = domProxy
  let restoreAutoFocus: (() => void) | undefined
  onCleanup(() => restoreAutoFocus?.())
  const position = stateView(pluginOptions.anchorPosition).map(
    (value) => value ?? 'bottom',
  )
  const margin = stateView(pluginOptions.triggerMargin).map(
    (value) => value ?? '4px',
  )
  // TODO：慢节点或作用域退出后关联可能晚执行，由 [Task](../../../../../docs/todo/261107_Task与TaskResult异步操作.md) 接管就绪与取消。
  Promise.all([group.triggerTarget!, domProxy]).then(([trigger, body]) => {
    const button = trigger as HTMLButtonElement
    button.popoverTargetElement = body
  })
  addProps({
    style: {
      'position-anchor': group.anchor,
      'position-area': position,
      'margin': margin,
    },
    htmlProps: {
      'popover': pluginOptions.popover ?? 'auto',
      'data-plugin': { mergable: 'popover-body' },
      'data-placement': position,
    },
    on: {
      beforetoggle: {
        passive: false,
        callback: ({ event, element }) => {
          const toggle = event as PopoverToggleEvent
          const open = toggle.newState === 'open'
          pluginOptions.onBeforeToggle?.(open, toggle)
          if (open) pluginOptions.onBeforeOpen?.(toggle)
          else pluginOptions.onBeforeClose?.(toggle)
          if (open && !toggle.defaultPrevented) {
            restoreAutoFocus?.()
            restoreAutoFocus = preparePopoverAutoFocus(
              element,
              pluginOptions.autoFocus,
            )
          }
        },
      },
      toggle: ({ event, element }) => {
        const open = element.matches(':popover-open')
        group.isOpen.set(open)
        const toggle = event as PopoverToggleEvent
        pluginOptions.onToggle?.(open, toggle)
        if (open) pluginOptions.onOpen?.(toggle)
        else pluginOptions.onClose?.(toggle)
      },
    },
  })
  const controller = createPopoverNodeController(group)
  // 首个完成的来源值只决定一次初始状态，不响应后续变化。
  let initialized = false
  createEffect(
    () => val(pluginOptions.defaultOpen),
    (open) => {
      if (initialized) return
      initialized = true
      if (open) controller.showPopover()
    },
  )
  return controller
}

/**
 * 为当前能力作用域指定原生 autofocus，并返回原声明的恢复动作。
 */
function preparePopoverAutoFocus(
  body: HTMLElement,
  requested?: Partial<HTMLElement>,
): (() => void) | undefined {
  const target = requested
    ? resolveFocusTarget(body, requested)
    : findFirstFocusableElement(body)
  if (!target) return
  const marked = [
    ...(body.hasAttribute('autofocus') ? [body] : []),
    ...body.querySelectorAll<HTMLElement>('[autofocus]'),
  ].map((node) => ({ node, value: node.getAttribute('autofocus')! }))
  marked.forEach(({ node }) => node.removeAttribute('autofocus'))
  target.setAttribute('autofocus', '')
  return () => {
    target.removeAttribute('autofocus')
    marked.forEach(({ node, value }) => node.setAttribute('autofocus', value))
  }
}

/**
 * 将正文内的 DOM 引用解析为实际元素；其他目标类型尚未支持。
 * TODO：后续在此扩充 Controller 与 Component 目标。
 */
function resolveFocusTarget(
  body: HTMLElement,
  requested: Partial<HTMLElement>,
): HTMLElement {
  if (typeof requested.isSameNode !== 'function')
    throw new TypeError('autoFocus 需要已接入的 DOM 引用')
  const target = [body, ...body.querySelectorAll<HTMLElement>('*')].find(
    (node) => requested.isSameNode!(node),
  )
  if (!target) throw new TypeError('autoFocus 目标必须位于 Popover 正文中')
  return target
}

/**
 * 找到正文内按文档顺序出现的首个可聚焦节点。
 */
function findFirstFocusableElement(body: HTMLElement): HTMLElement | undefined {
  const candidates = body.querySelectorAll<HTMLElement>(
    'button, input:not([type="hidden"]), select, textarea, a[href], area[href], summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]',
  )
  return [...candidates].find((candidate) => {
    if (
      candidate.matches(':disabled') ||
      candidate.closest('[hidden], [inert]')
    )
      return false
    const visibility = getComputedStyle(candidate).visibility
    if (visibility === 'hidden' || visibility === 'collapse') return false
    for (
      let node: HTMLElement | null = candidate;
      node && node !== body;
      node = node.parentElement
    ) {
      if (getComputedStyle(node).display === 'none') return false
      const parent: HTMLElement | null = node.parentElement
      if (
        parent instanceof HTMLDetailsElement &&
        !parent.open &&
        parent.querySelector(':scope > summary') !== node
      )
        return false
    }
    return true
  })
}

/**
 * 构建成对的触发与浮层能力。
 * @see ./SPEC.md
 * @example
 * const { popoverTrigger, popoverBody } = popover()
 * <><Button is={popoverTrigger}>打开</Button><Card is={popoverBody}>说明</Card></>
 */
export const popover = defineInactivePlugins({
  popoverTrigger: popoverTriggerCore,
  popoverBody: popoverBodyCore,
})
