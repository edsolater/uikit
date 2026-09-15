/** 媒体条件下生效的 CSS 规则。 */
import { block, type Block, type Content, type Rule } from '../core/css-block'
import type { RenderContext } from '../core/css-value'

export interface Media extends Block<Rule> {
  kind: 'media'
  condition: string
}

/** 媒体条件分支，可通过 of 追加规则；浏览器仅在条件满足时应用。 */
export function media(condition: string, ...body: Content<Rule>[]): Media {
  return block<Media>({
    kind: 'media',
    condition,
    body: [],
    parseCss(context?: RenderContext) {
      return `@media ${this.condition} { ${this.body.map((rule) => rule.parseCss(context)).join('\n')} }`
    },
  }).of(...body)
}
