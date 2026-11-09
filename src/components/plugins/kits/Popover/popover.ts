/**
 * Popover 的成对节点能力。
 *
 * 负责连接触发节点与原生浮层，声明定位、显隐操作和状态；不提供正文或材料。
 * 使用方在实际按钮和内容节点上分别安装两个角色。
 */
import { IdGenerator, task, type Task, type PromiseResultProxy } from '@edsolater/fnkit'
import {
  createEffect,
  createState,
  onCleanup,
  withDefault,
  toStateString,
  val,
  type Source,
  type State,
} from '@/foundation'
import { createInactivePlugins } from '@/components/plugins/tools/createInactivePlugins'
import type { PluginCoreContext, PluginResult } from '@/components/plugins/tools/createInactivePlugin'
import './popover.style'

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left'
export type AnchorGap = 'sm' | 'md' | 'lg'
export type PopoverToggleEvent = Event & {
  oldState: 'open' | 'closed'
  newState: 'open' | 'closed'
}

export interface PopoverTriggerOptions {
  /** 原生按钮动作，默认 toggle；false 仅建立锚点，不接入按钮触发与展开语义。 */
  triggerAction?: 'toggle' | 'show' | 'hide' | false
}

export interface PopoverBodyOptions {
  /** 主体相对锚点的方向，默认 top。 */
  $anchorPosition?: Source<AnchorPosition | undefined>
  /** 指定锚点与主体的间距档位，默认 md；实际距离由样式定义。 */
  $anchorGap?: Source<AnchorGap | undefined>
  popover?: 'auto' | 'hint' | 'manual'
  /** 首个完成的值决定是否默认打开一次；后续变化不重新初始化。 */
  defaultOpen?: Source<boolean | undefined>
  /** 打开时优先聚焦的 DOM 引用；省略时使用正文首个可聚焦节点，false 不注入自动聚焦。Controller 和组件目标尚未支持。 */
  autoFocus?: Partial<HTMLElement> | false

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

/**
 * 触发端的显隐操作与本组打开状态。
 */
export interface PopoverTriggerController {
  /**
   * 与正文端共享的原生打开状态。
   */
  isOpen: State<boolean>
  /**
   * 显示本组浮层；操作配置尚待确定。
   * 同步返回本次 TaskResult；await 等待原生操作执行，unsubscribe 可取消尚未执行的操作。
   */
  showPopover: Task<[], void>
  /**
   * 关闭本组浮层；焦点恢复遵循浏览器原生行为。
   */
  hidePopover: Task<[], void>
  /**
   * 切换浮层；force 可指定打开或关闭。
   */
  togglePopover: Task<[options?: { force?: boolean }], void>
}

/**
 * 正文端的显隐操作与本组打开状态。
 */
export interface PopoverBodyController {
  /**
   * 与触发端共享的原生打开状态。
   */
  isOpen: State<boolean>
  /**
   * 请求显示本组正文，打开配置由正文端决定。
   */
  showPopover: Task<[], void>
  /**
   * 请求关闭本组正文，焦点恢复遵循浏览器原生行为。
   */
  hidePopover: Task<[], void>
  /**
   * 切换正文；force 可指定打开或关闭。
   */
  togglePopover: Task<[options?: { force?: boolean }], void>
}

/**
 * 本组两端的控制入口，以及常用显隐操作的快捷引用。
 */
export interface PopoverController {
  /**
   * 触发端的完整控制入口。
   */
  trigger: PopoverTriggerController
  /**
   * 正文端的完整控制入口。
   */
  body: PopoverBodyController
  /**
   * 两端共享的同一个打开状态。
   */
  isOpen: State<boolean>
  /**
   * trigger.showPopover 的直接引用，不另外包装操作。
   */
  showPopover: PopoverTriggerController['showPopover']
  /**
   * body.hidePopover 的直接引用，不另外包装操作。
   */
  hidePopover: PopoverBodyController['hidePopover']
  /**
   * trigger.togglePopover 的直接引用，force 可指定打开或关闭。
   */
  togglePopover: PopoverTriggerController['togglePopover']
}

/** 两端的构建配置；字段继续对应各自负责的节点。 */
export interface PopoverOptions {
  /**
   * 触发节点的原生动作配置。
   */
  trigger?: PopoverTriggerOptions
  /**
   * 正文节点的定位、打开与事件配置。
   */
  body?: PopoverBodyOptions
}

/** 两端的能力结果集合；各端可直接交给实际节点的 is。 */
export interface PopoverPlugins {
  /**
   * 安装到触发节点的能力声明。
   */
  trigger: PluginResult<PopoverTriggerController>
  /**
   * 安装到正文节点的能力声明。
   */
  body: PluginResult<PopoverBodyController>
}

/** 成对能力及其控制入口；集合本身不作为单个 Plugin 交给 is。 */
export interface PopoverResult {
  /**
   * 两端的能力结果，分别安装到实际节点。
   */
  plugins: PopoverPlugins
  /**
   * 两端的完整 Controller 与常用操作快捷引用。
   */
  controller: PopoverController
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
    anchor: `--${name}`,
    isOpen: isOpen,
    nativeTrigger: true,
    triggerTarget: undefined as PromiseResultProxy<HTMLElement> | undefined,
    bodyTarget: undefined as PromiseResultProxy<HTMLElement> | undefined,
  }
}

/**
 * 为单个角色提供显隐 Task；等待正文 DOM 后检查取消，再执行原生操作。
 * 原生 toggle 更新状态，关闭操作另读实际结果以覆盖节点移除不派事件的情况。
 */
function createPopoverActions(
  group: ReturnType<typeof createPopoverGroup>,
) {
  return {
    isOpen: group.isOpen,
    /**
     * 请求显示本组浮层。
     */
    showPopover: task(async ({ canContinue }) => {
      const body = await group.bodyTarget!
      await canContinue()
      body.showPopover()
    }),
    /**
     * 请求关闭本组浮层并读取实际关闭结果。
     */
    hidePopover: task(async ({ canContinue }) => {
      const body = await group.bodyTarget!
      await canContinue()
      if (body.matches(':popover-open')) body.hidePopover()
      group.isOpen.set(body.matches(':popover-open'))
    }),
    /**
     * 切换或指定打开状态。
     */
    togglePopover: task(async ({ canContinue }, options?: { force?: boolean }) => {
      const body = await group.bodyTarget!
      await canContinue()
      body.togglePopover(options?.force)
    }),
  }
}

/**
 * 触发节点声明本组锚点，按配置接入原生按钮行为。
 * 内容及按钮身份由使用方提供。
 */
function popoverTriggerCore({
  pluginOptions,
  addProps,
  domProxy,
  id,
}: PluginCoreContext<PopoverTriggerOptions>): PopoverTriggerController {
  const group = popoverGroups.getOrInsertComputed(id!, createPopoverGroup)
  group.triggerTarget = domProxy
  group.nativeTrigger = pluginOptions.triggerAction !== false
  addProps({ style: { 'anchor-name': group.anchor } })
  if (group.nativeTrigger) addProps({
    htmlProps: {
      'popovertargetaction': pluginOptions.triggerAction ?? 'toggle',
      'aria-expanded': toStateString(group.isOpen),
      'aria-haspopup': 'dialog',
    },
  })
  return createPopoverActions(group)
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
}: PluginCoreContext<PopoverBodyOptions>): PopoverBodyController {
  const group = popoverGroups.getOrInsertComputed(id!, createPopoverGroup)
  group.bodyTarget = domProxy
  let restoreAutoFocus: (() => void) | undefined
  onCleanup(() => restoreAutoFocus?.())
  const position = withDefault(pluginOptions.$anchorPosition, 'top')
  // TODO：慢节点或作用域退出后关联可能晚执行，由 [Task](../../../../../../fnkit/docs/plans/261108_Task与Result执行.md) 接管就绪与取消。
  if (group.nativeTrigger) Promise.all([group.triggerTarget!, domProxy]).then(([trigger, body]) => {
    const button = trigger as HTMLButtonElement
    button.popoverTargetElement = body
  })
  addProps({
    style: {
      'position-anchor': group.anchor,
      'position-area': position,
    },
    htmlProps: {
      'popover': pluginOptions.popover ?? 'auto',
      'data-plugin': { mergable: 'popover-body' },
      'data-placement': position,
      'data-anchor-gap': pluginOptions.$anchorGap,
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
            restoreAutoFocus = pluginOptions.autoFocus === false
              ? undefined
              : preparePopoverAutoFocus(element, pluginOptions.autoFocus)
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
  const controller = createPopoverActions(group)
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
 * 在组件内构建成对浮层能力；plugins 中的两端交给节点，controller 提供控制入口。
 * 配置分别作用于触发端和正文端；每次调用创建独立的一组。
 * @see ./SPEC.md
 * @example
 * const { plugins: popoverPlugins, controller: popoverController } = createPopoverPlugins()
 * const { trigger: popoverTrigger, body: popoverBody } = popoverPlugins
 * const { trigger: triggerController, body: bodyController } = popoverController
 * <><Button is={popoverTrigger}>打开</Button><Card is={popoverBody}>说明</Card></>
 * await popoverController.hidePopover() // 与 bodyController.hidePopover 是同一个 Task
 */
export const createPopoverPlugins: (
  pluginOptions?: PopoverOptions,
) => PopoverResult = createInactivePlugins(
  { trigger: popoverTriggerCore, body: popoverBodyCore },
  {
    /**
     * 为本组提供共享打开状态和常用显隐方法的直接引用。
     */
    controller({ trigger, body }) {
      return {
        isOpen: trigger.isOpen,
        showPopover: trigger.showPopover,
        hidePopover: body.hidePopover,
        togglePopover: trigger.togglePopover,
      }
    },
  },
)
