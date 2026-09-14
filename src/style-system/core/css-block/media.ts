/** 媒体条件下生效的 CSS 规则。 */
import { flattenContent, type Block, type Content, type Rule } from '../css-block'
import type { RenderContext } from '../css-value'

export interface Media extends Block {
  readonly kind: 'media'
  readonly condition: string
  readonly body: readonly Rule[]
}

/** 媒体条件分支；浏览器只在条件满足时应用内部规则。 */
export function media(condition: string, ...body: Content<Rule>[]): Media {
  return {
    kind: 'media',
    condition,
    body: flattenContent<Rule>(body),
    parseCss(context?: RenderContext) {
      return `@media ${this.condition} { ${this.body.map((rule) => rule.parseCss(context)).join('\n')} }`
    },
  }
}
