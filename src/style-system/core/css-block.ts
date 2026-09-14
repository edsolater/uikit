/** CSS 规则的格式接口与顶层规则范围。 */
import type { Keyframes } from './css-block/keyframe'
import type { Media } from './css-block/media'
import type { PropertyRule } from './css-block/property'
import type { StyleRule } from './css-block/style'
import type { RenderContext } from './css-value'

export type BlockKind = 'style-rule' | 'media' | 'keyframes' | 'frame' | 'property-rule'

export interface Block {
  readonly kind: BlockKind
  /** 输出完整 CSS；context 沿内部节点传递，省略时不触发激活。 */
  parseCss(context?: RenderContext): string
}

/** 可直接插入样式表。 */
export type Rule = StyleRule | Media | Keyframes | PropertyRule
