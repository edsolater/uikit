/** 选择器下的属性、嵌套样式和媒体规则。 */
import { flattenContent, type Block, type Content } from '../css-block'
import type { Declaration } from '../css-declaration'
import type { RenderContext } from '../css-value'
import type { Media } from './media'

export type StyleNode = Declaration | StyleRule | Media
export type StyleBody = readonly Content<StyleNode>[]

export interface StyleRule extends Block {
  readonly kind: 'style-rule'
  readonly selector: string
  readonly body: readonly StyleNode[]
}

/**
 * 绑定选择器后，每次调用独立组合内容，不累计先前规则。
 * @example
 * const hover = styleRule('&:hover')
 * const button = styleRule('.Button')(layout, appearance, hover(hoverAppearance))
 */
export function styleRule(selector: string) {
  return (...content: StyleBody): StyleRule => ({
    kind: 'style-rule',
    selector,
    body: flattenContent<StyleNode>(content),
    parseCss(context?: RenderContext) {
      return `${this.selector} { ${this.body.map((node) => node.parseCss(context)).join('\n')} }`
    },
  })
}
