/** CSS Block 持有累计内容，具体种类负责对应的 CSS 格式。 */
import type { Keyframes } from '../css-block/keyframe'
import type { Media } from '../css-block/media'
import type { PropertyRule } from '../css-block/property'
import type { StyleRule } from '../css-block/style'
import type { RenderContext } from './css-value'

export type BlockKind = 'style-rule' | 'media' | 'keyframes' | 'frame' | 'property-rule'

export interface Block<Node = unknown> {
  /** 向自身追加内容并返回自身；空内容不创建副本。 */
  of(...content: Content<Node>[]): this

  kind: BlockKind

  /** 当前累计的节点；追加经过 of 入口，读取时保留子节点身份。 */
  body: Node[]

  /** 输出完整 CSS；context 沿内部节点传递，省略时不触发激活。 */
  parseCss(context?: RenderContext): string
}

/** 可直接插入样式表。 */
export type Rule = StyleRule | Media | Keyframes | PropertyRule

/** 集合只负责分组；CSS 结构仍由节点决定。 */
export type Content<T> = T | Content<T>[]

/**
 * 每个 Block 独立累计内容；具体语法由 definition 提供。
 * @example
 * const rule = block<StyleRule>({ kind: 'style-rule', selector, body: [], parseCss })
 * rule.of(declarations)
 */
export function block<B extends Block<B['body'][number]>>(
  definition: Omit<B, 'of'>,
): Omit<B, 'of'> & Block<B['body'][number]> {
  type Node = B['body'][number]
  const body: Node[] = [...definition.body]

  return {
    ...definition,
    body,
    of(...content: Content<Node>[]) {
      for (const node of flattenContent<Node>(content)) body.push(node)
      return this
    },
  }
}

/** 按原顺序取得节点快照，不展开节点内部的 CSS 结构。 */
export function flattenContent<T>(content: Content<T>[]): T[] {
  const result: T[] = []
  const pending = [...content].reverse()
  while (pending.length) {
    const item = pending.pop()!
    if (Array.isArray(item)) {
      for (let index = item.length - 1; index >= 0; index--) pending.push(item[index])
    } else {
      result.push(item as T)
    }
  }
  return result
}
