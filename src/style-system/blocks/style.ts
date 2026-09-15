/** 选择器下的属性、嵌套样式和媒体规则。 */
import { block, type Block, type Content } from '../core/css-block'
import type { Declaration } from '../core/css-declaration'
import type { RenderContext } from '../core/css-value'
import type { Media } from './media'

export type StyleNode = Declaration<string, unknown> | StyleRule | Media
export type StyleBody = Content<StyleNode>[]

export interface StyleRule extends Block<StyleNode> {
  kind: 'style-rule'
  selector: string
}

/**
 * 创建具有独立状态的选择器规则；of 持续加入同一规则。
 * @example
 * const hoverStyle = styleRule('&:hover')
 * const kitRoot = styleRule('.Button').of(layout, hoverStyle)
 * kitRoot.of(appearance)
 * hoverStyle.of(hoverAppearance) // 已连接的分支仍可通过自身入口补充内容。
 */
export function styleRule(selector: string): StyleRule {
  return block<StyleRule>({
    kind: 'style-rule',
    selector,
    body: [],
    parseCss(context?: RenderContext) {
      return `${this.selector} { ${this.body.map((node) => node.parseCss(context)).join('\n')} }`
    },
  })
}
