/** 动画关键帧及其时间位置。 */
import { flattenContent, type Block, type Content } from '../css-block'
import type { Declaration } from '../css-declaration'
import { parseValue, type RenderContext, type Value } from '../css-value'

export interface Keyframes extends Block {
  readonly kind: 'keyframes'
  readonly name: Value
  readonly body: readonly Frame[]
}

/** 只能放在 Keyframes 内部。 */
export interface Frame extends Block {
  readonly kind: 'frame'
  /** 例如 from、to 或 0%, 50%。 */
  readonly position: string
  readonly body: readonly Declaration[]
}

/** 按动画名组织各时间点的样式；名称 Value 也沿渲染路径参与激活。 */
export function keyframes(name: Value, ...body: Content<Frame>[]): Keyframes {
  return {
    kind: 'keyframes',
    name,
    body: flattenContent<Frame>(body),
    parseCss(context?: RenderContext) {
      return `@keyframes ${parseValue(this.name, context)} { ${this.body.map((frame) => frame.parseCss(context)).join('\n')} }`
    },
  }
}

/** 动画在指定时间点的样式；position 可写 from、to 或百分比列表。 */
export function frame(position: string, ...body: Content<Declaration>[]): Frame {
  return {
    kind: 'frame',
    position,
    body: flattenContent<Declaration>(body),
    parseCss(context?: RenderContext) {
      return `${this.position} { ${this.body.map((declaration) => declaration.parseCss(context)).join('\n')} }`
    },
  }
}
