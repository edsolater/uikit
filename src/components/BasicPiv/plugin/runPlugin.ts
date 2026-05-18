/**
 * 这个文件负责执行单个 Piv plugin，并给 plugin 提供受控的结构插线工具。
 * 它处在 plugin 队列展开之后、shadow props 合并之前：上游已经决定要运行哪个 plugin，下游只消费 plugin 返回的 shadow props。
 * 它不负责合并 shadow props，不负责消费 class/style/htmlProps/on/ref，也不负责把结构能力暴露成普通 Piv props。
 * plugin 的返回值只表达 prompt 类声明补丁；第二参数提供的结构工具会改变真实 DOM 附属结构，
 * 但不应改变调用方心智里的 Piv 主体层级。
 */

import type { PivHTMLElement, PivTag } from '../domMap'
import type { ShadowProps } from './handlePivPlugin'
import { onCleanup, onMount, type JSXElement } from 'solid-js'
import { insert } from 'solid-js/web'

/**
 * Piv plugin 是 Piv 的高权限增强入口。
 * 参数是当前 plugin 的运行上下文，包含当前 Piv DOM 和结构插线能力。
 * 返回值只用于补充 shadow props，不用于描述结构插入。
 */
export type PivPlugin<Tag extends PivTag> = (context: PivPluginContext<Tag>) => undefined | ShadowProps<Tag>

/**
 * 运行单个 plugin。
 * 这里负责把当前 DOM 和结构工具传给 plugin，并把 plugin 返回的 shadow props 原样交给上层合并。
 */
export function runPlugin<Tag extends PivTag>(
  plugin: PivPlugin<Tag>,
  element: PivHTMLElement<Tag>,
): ShadowProps<Tag> | undefined {
  return plugin(createPivPluginContext(element))
}

/**
 * 传给 Piv plugin 的运行上下文。
 * element 是当前 Piv 已经创建出的真实 DOM。
 * 所有插入内容都接收 JSXElement，让插件作者继续用 Solid JSX 表达附属结构。
 * 工具内部负责把 JSX 挂到 Piv DOM 周围的端点，并在 Piv 清理时移除对应挂载范围。
 * 这些工具属于结构增强能力：可以挂载辅助结构，但不应用来重定义组件主体是什么。
 */
export type PivPluginContext<Tag extends PivTag> = {
  /**
   * 当前 Piv DOM。
   * 插件需要读取 DOM 信息或组合更底层端点 API 时使用它。
   */
  element: PivHTMLElement<Tag>

  /**
   * 插到 Piv 前面，成为前一个 sibling。
   */
  insertBefore: (content: JSXElement) => void

  /**
   * 插到 Piv 后面，成为后一个 sibling。
   */
  insertAfter: (content: JSXElement) => void

  /**
   * 插到 Piv 内部最前面。
   */
  prependChild: (content: JSXElement) => void

  /**
   * 插到 Piv 内部最后面。
   */
  appendChild: (content: JSXElement) => void

  /**
   * 给 Piv 插入父级 wrapper，并把 Piv 移入 wrapper。
   */
  wrapOutside: (wrapper: JSXElement) => void
}

/**
 * 创建当前 plugin 的运行上下文。
 * 上下文绑定到一个具体 Piv DOM，因此所有结构插线都围绕这个 DOM 的当前位置执行。
 */
function createPivPluginContext<Tag extends PivTag>(element: PivHTMLElement<Tag>): PivPluginContext<Tag> {
  // 多次 after() 应按调用顺序继续向后追加，而不是每次都插到 Piv 紧后方倒序堆叠。
  let afterTail: Node = element
  let isMounted = false
  const pendingOperations: (() => void)[] = []
  const mountedRanges = new Set<MountedRange>()

  // Piv 的 ref 会早于 DOM 挂到父节点执行，before/after/wrap 这类 sibling 操作必须等到 mount 后。
  onMount(() => {
    isMounted = true
    for (const operation of pendingOperations) {
      operation()
    }
    pendingOperations.length = 0
  })

  onCleanup(() => {
    for (const range of mountedRanges) {
      removeRange(range)
    }
    mountedRanges.clear()
  })

  const runAfterMounted = (operation: () => void) => {
    if (isMounted) {
      operation()
      return
    }

    pendingOperations.push(operation)
  }

  const trackRange = (range: MountedRange) => {
    mountedRanges.add(range)
    return range
  }

  return {
    element,
    insertBefore: (content) => {
      runAfterMounted(() => {
        trackRange(mountBefore(element, content))
      })
    },
    insertAfter: (content) => {
      runAfterMounted(() => {
        const range = trackRange(mountAfter(afterTail, content))
        afterTail = range.end
      })
    },
    prependChild: (content) => {
      runAfterMounted(() => {
        trackRange(mountPrepend(element, content))
      })
    },
    appendChild: (content) => {
      runAfterMounted(() => {
        trackRange(mountAppend(element, content))
      })
    },
    wrapOutside: (wrapper) => {
      // wrapper 先作为 JSX 挂到 Piv 原位置，再把 Piv 移入 wrapper。
      // 这样 sibling1/Piv/sibling2 会变成 sibling1/wrapper(Piv)/sibling2。
      runAfterMounted(() => {
        const range = trackRange(mountBefore(element, wrapper))
        const wrapperElement = findFirstElementBetween(range.start, range.end)
        if (!wrapperElement) return
        wrapperElement.moveBefore(element, null)
      })
    },
  }
}

/**
 * 记录一次 JSX 挂载在真实 DOM 中占据的闭区间。
 * start/end 是内部哨兵节点，用于 cleanup 时精准移除 Solid 插入出来的一组节点。
 */
type MountedRange = {
  /** 挂载范围开始哨兵，不属于调用方 JSX 内容。 */
  start: Comment

  /** 挂载范围结束哨兵，Solid insert 会把 JSX 内容插到它前面。 */
  end: Comment
}

/**
 * 把 JSX 挂载到 reference 前方。
 * 返回范围用于 wrap 查找 wrapper 元素，也用于 cleanup 清理插入内容。
 */
function mountBefore(reference: Node, content: JSXElement): MountedRange {
  const range = createMountedRange()
  const parent = reference.parentNode
  if (!parent) return range
  parent.insertBefore(range.start, reference)
  parent.insertBefore(range.end, reference)
  mountContent(range, content)
  return range
}

/**
 * 把 JSX 挂载到 reference 后方。
 * 这里使用 reference.nextSibling 定位，而不是依赖 ChildNode.after()，便于同时支持 Element 和 Comment 哨兵。
 */
function mountAfter(reference: Node, content: JSXElement): MountedRange {
  const range = createMountedRange()
  const parent = reference.parentNode
  if (!parent) return range
  const nextSibling = reference.nextSibling
  parent.insertBefore(range.start, nextSibling)
  parent.insertBefore(range.end, nextSibling)
  mountContent(range, content)
  return range
}

/**
 * 把 JSX 挂载到 parent 的第一个 child 之前。
 * 这是 Piv 内部 child 端点插线，不改变 Piv 自身和 sibling 关系。
 */
function mountPrepend(parent: Element, content: JSXElement): MountedRange {
  const range = createMountedRange()
  parent.prepend(range.start, range.end)
  mountContent(range, content)
  return range
}

/**
 * 把 JSX 挂载到 parent 的最后一个 child 之后。
 * 这是 Piv 内部 child 端点插线，不改变 Piv 自身和 sibling 关系。
 */
function mountAppend(parent: Element, content: JSXElement): MountedRange {
  const range = createMountedRange()
  parent.append(range.start, range.end)
  mountContent(range, content)
  return range
}

/**
 * 创建一对挂载哨兵。
 * 哨兵让 JSX 可以是多个 sibling、文本或空内容，而 cleanup 仍然能知道要移除哪一段。
 */
function createMountedRange(): MountedRange {
  return {
    start: document.createComment('piv-structure:start'),
    end: document.createComment('piv-structure:end'),
  }
}

/**
 * 在 range.end 前挂载 Solid JSX。
 * 这里不返回 DOM 节点，因为 JSX 可能展开成文本、多个节点或条件内容。
 * cleanup 由 createPivPluginContext 统一管理，避免延迟挂载后丢失 Piv 生命周期归属。
 */
function mountContent(range: MountedRange, content: JSXElement) {
  const parent = range.end.parentNode
  if (!parent) return

  insert(parent, () => content, range.end)
}

/**
 * 移除 start 到 end 的整段挂载内容。
 * 清理时包含两个哨兵，确保下次 DOM 查询不会看到废弃的内部 marker。
 */
function removeRange(range: MountedRange) {
  const parent = range.start.parentNode
  if (!parent) return

  let current: Node | null = range.start
  while (current) {
    const next: Node | null = current.nextSibling
    parent.removeChild(current)
    if (current === range.end) return
    current = next
  }
}

/**
 * 从一次 JSX 挂载范围里找到第一个 Element。
 * wrap 需要一个真实 Element 作为 wrapper；如果调用方传入文本或空内容，就不会接管 Piv。
 */
function findFirstElementBetween(start: Node, end: Node): Element | undefined {
  let current = start.nextSibling
  while (current && current !== end) {
    if (current instanceof Element) return current
    current = current.nextSibling
  }
  return undefined
}
