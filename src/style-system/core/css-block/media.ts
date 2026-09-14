/** 媒体条件下生效的 CSS 规则。 */
import type { Block, Rule } from '../css-block'
import type { RenderContext } from '../css-value'

export interface Media extends Block {
  readonly kind: 'media'
  readonly condition: string
  readonly body: readonly Rule[]
}

export function media(condition: string, body: readonly Rule[]): Media {
  return {
    kind: 'media', condition, body: [...body],
    parseCss(context?: RenderContext) {
      return `@media ${this.condition} { ${this.body.map(rule => rule.parseCss(context)).join('\n')} }`
    },
  }
}
