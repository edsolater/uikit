/** CSS Block 持有累计内容，具体种类负责对应的 CSS 格式。 */
import { flapDeep, type MayDeepArray } from '@edsolater/fnkit'
import type { Keyframes } from '../blocks/keyframe'
import type { Media } from '../blocks/media'
import type { PropertyRule } from '../blocks/property'
import type { StyleRule } from '../blocks/style'
import type { RenderContext } from './css-value'

export type BlockKind = 'style-rule' | 'media' | 'keyframes' | 'frame' | 'property-rule'

export interface Block<Node = unknown> {
  /**
   * 展开分组数组后向自身追加节点；不进入节点内部的 content。
   * @example rule.of(a, [b, [c]]) // 接收结果等效于 rule.of(a, b, c)，节点引用不变。
   */
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
export type Content<T> = MayDeepArray<T>

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
      for (const node of flapDeep(content)) body.push(node)
      return this
    },
  }
}
