/** Piv 实际节点的结构插入工具，附属内容随节点清理。 */
import { isString } from '@edsolater/fnkit'
import {
  children,
  createEffect,
  onCleanup,
  insert,
  type JSXElement,
} from '@/foundation'
import type { PivHTMLElement, PivTag } from '../domMap'

type StructurePosition = 'before' | 'after' | 'prepend' | 'append' | 'wrap'

/** 创建当前 DOM 的结构插入工具；位置在提交时确定，内容交给 Solid 解析与更新。 */
export function createPivStructure<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
) {
  // 多次 after 按声明顺序追加；其他位置均在提交时读取当前 DOM 关系。
  let afterTail: ChildNode = element

  const insertContent = (position: StructurePosition, content: JSXElement) => {
    const range: MountedRange = {
      start: document.createComment('piv-structure:start'),
      end: document.createComment('piv-structure:end'),
    }
    // 单个 DOM 已经解析完成；只有 JSX 来源需要 children 持有条件和子作用域。
    const resolved =
      content instanceof Node
        ? () => [content]
        : children(() => content).toArray
    let previousNodes: Node[] = []

    /**
     * 将最新附属节点提交到宿主当前位置，保留范围身份和多次after顺序。
     */
    const commit = (nodes: Node[]) => {
      if (!range.end.parentNode) {
        switch (position) {
          case 'before':
          case 'wrap':
            element.before(range.start, range.end)
            break
          case 'after':
            afterTail.after(range.start, range.end)
            if (range.end.parentNode) afterTail = range.end
            break
          case 'prepend':
            element.prepend(range.start, range.end)
            break
          case 'append':
            element.append(range.start, range.end)
            break
        }
      }
      const parent = range.end.parentNode
      if (!parent) return
      insert(parent, nodes, range.end, previousNodes)
      previousNodes = nodes
      if (position === 'wrap') {
        const wrapper = nodes.find(
          (node): node is Element => node instanceof Element,
        )
        if (wrapper) wrapper.moveBefore(element, null)
      }
    }

    createEffect(() => {
      const nodes: Node[] = []
      for (const child of resolved()) {
        // Fragment 插入后会被清空，提交与下一轮 diff 必须记录实际移出的子节点。
        if (child instanceof DocumentFragment) nodes.push(...child.childNodes)
        else if (child instanceof Node) nodes.push(child)
        else if (isString(child) || typeof child === 'number') {
          nodes.push(document.createTextNode(String(child)))
        }
      }
      return nodes
    }, commit)
    onCleanup(() => removeRange(range))
  }

  return {
    insertBefore: (content) => insertContent('before', content),
    insertAfter: (content) => insertContent('after', content),
    prependChild: (content) => insertContent('prepend', content),
    appendChild: (content) => insertContent('append', content),
    wrapOutside: (content) => insertContent('wrap', content),
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
