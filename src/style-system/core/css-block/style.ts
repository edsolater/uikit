/** 选择器下的属性、嵌套样式和媒体规则。 */
import type { Block } from '../css-block'
import type { Declaration } from '../css-declaration'
import type { RenderContext } from '../css-value'
import type { Media } from './media'

export type StyleBody = readonly (Declaration | StyleRule | Media)[]

export interface StyleRule extends Block {
  readonly kind: 'style-rule'
  readonly selector: string
  readonly body: StyleBody
}

export function styleRule(selector: string, body: StyleBody = []): StyleRule {
  return {
    kind: 'style-rule', selector, body: [...body],
    parseCss(context?: RenderContext) {
      return `${this.selector} { ${this.body.map(node => node.parseCss(context)).join('\n')} }`
    },
  }
}
