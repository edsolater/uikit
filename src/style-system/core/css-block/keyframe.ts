/** 动画关键帧及其时间位置。 */
import type { Block } from '../css-block'
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

export function keyframes(name: Value, body: readonly Frame[]): Keyframes {
  return {
    kind: 'keyframes', name, body: [...body],
    parseCss(context?: RenderContext) {
      return `@keyframes ${parseValue(this.name, context)} { ${this.body.map(frame => frame.parseCss(context)).join('\n')} }`
    },
  }
}

export function frame(position: string, body: readonly Declaration[]): Frame {
  return {
    kind: 'frame', position, body: [...body],
    parseCss(context?: RenderContext) {
      return `${this.position} { ${this.body.map(declaration => declaration.parseCss(context)).join('\n')} }`
    },
  }
}
