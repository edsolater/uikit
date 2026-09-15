/** 动画关键帧及其时间位置。 */
import { block, type Block, type Content } from '../core/css-block'
import type { Declaration } from '../core/css-declaration'
import { parseValue, type RenderContext, type Value } from '../core/css-value'

export interface Keyframes extends Block<Frame> {
  kind: 'keyframes'
  name: Value
}

/** 只能放在 Keyframes 内部。 */
export interface Frame extends Block<Declaration<string, unknown>> {
  kind: 'frame'
  /** 例如 from、to 或 0%, 50%。 */
  position: string
}

/** 按动画名累计各时间点的样式；名称 Value 也沿渲染路径参与激活。 */
export function keyframes(name: Value, ...body: Content<Frame>[]): Keyframes {
  return block<Keyframes>({
    kind: 'keyframes',
    name,
    body: [],
    parseCss(context?: RenderContext) {
      return `@keyframes ${parseValue(this.name, context)} { ${this.body.map((frame) => frame.parseCss(context)).join('\n')} }`
    },
  }).of(...body)
}

/** 动画在指定时间点累计的样式；position 可写 from、to 或百分比列表。 */
export function frame(position: string, ...body: Content<Declaration<string, unknown>>[]): Frame {
  return block<Frame>({
    kind: 'frame',
    position,
    body: [],
    parseCss(context?: RenderContext) {
      return `${this.position} { ${this.body.map((declaration) => declaration.parseCss(context)).join('\n')} }`
    },
  }).of(...body)
}
