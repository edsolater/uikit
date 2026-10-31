/**
 * 这个文件负责执行单个 Piv plugin，并给 plugin 提供受控的结构插线工具。
 * 它处在 plugin 队列展开之后、shadow props 合并之前：上游已经决定要运行哪个 plugin，下游只消费 plugin 返回的 shadow props。
 * 它不负责合并 shadow props，不负责消费 class/style/htmlProps/on/domRef，也不负责把结构能力暴露成普通 Piv props。
 * plugin 的返回值只表达 prompt 类声明补丁；第二参数提供的结构工具会改变真实 DOM 附属结构，
 * 但不应改变调用方心智里的 Piv 主体层级。
 */
import { hasProperty, isFunction, isString } from '@edsolater/fnkit'
import { createPluginInstanceSymbol } from '../../plugins/plugin-instance'
import {
  children,
  createEffect,
  onCleanup,
  type JSXElement,
  insert,
} from '@/foundation'
import type { PivHTMLElement, PivTag } from '../domMap'
import type { ShadowProps } from './handlePivPlugin'
import type { Plugin } from '../../plugins/definePlugin'

/**
 * Piv plugin 是 Piv 的高权限增强入口。
 * 参数是当前 plugin 的运行上下文，包含当前 Piv DOM 和结构插线能力。
 * 返回值只用于补充 shadow props，不用于描述结构插入。
 */
export type PivPluginFunction<Tag extends PivTag = PivTag> = (
  payload: PivPluginPayload<Tag>,
) => undefined | ShadowProps<Tag>

export type PivPlugin<Tag extends PivTag = PivTag> =
  | PivPluginFunction<Tag>
  | Plugin<any, object, Tag>
  | { plugin: PivPluginFunction<Tag> }

/**
 * 运行单个 plugin。
 * 这里负责把当前 DOM 和结构工具传给 plugin，并把 plugin 返回的 shadow props 原样交给上层合并。
 */
export function runPlugin<Tag extends PivTag>(
  plugin: PivPlugin<Tag>,
  element: PivHTMLElement<Tag>,
): ShadowProps<Tag> | undefined {
  if (isDefinedPlugin(plugin)) {
    const pluginInstance = plugin[createPluginInstanceSymbol]()
    return pluginInstance.plugin(createPivPluginContext(element))
  }
  if (isFunction(plugin)) {
    return (plugin as PivPluginFunction<Tag>)(createPivPluginContext(element))
  } else {
    return plugin.plugin(createPivPluginContext(element))
  }
}

/** Piv 只在消费入口识别由 Plugin 领域定义的高层 Plugin。 */
function isDefinedPlugin<Tag extends PivTag>(
  plugin: PivPlugin<Tag>,
): plugin is Plugin<any, object, Tag> {
  return isFunction(plugin) && hasProperty(plugin, createPluginInstanceSymbol)
}

/**
 * 传给 Piv plugin 的运行上下文。
 * element 是当前 Piv 已经创建出的真实 DOM。
 * 所有插入内容都接收 JSXElement，让插件作者继续用 Solid JSX 表达附属结构。
 * 工具内部负责把 JSX 挂到 Piv DOM 周围的端点，并在 Piv 清理时移除对应挂载范围。
 * 这些工具属于结构增强能力：可以挂载辅助结构，但不应用来重定义组件主体是什么。
 */
export interface PivPluginPayload<Tag extends PivTag> {
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

type StructurePosition = 'before' | 'after' | 'prepend' | 'append' | 'wrap'

/** 创建当前 DOM 的结构插入工具；位置在提交时确定，内容交给 Solid 解析与更新。 */
function createPivPluginContext<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
): PivPluginPayload<Tag> {
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
    element,
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
