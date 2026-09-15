/** 自定义属性的 @property 注册规则。 */
import { block, type Block, type Content } from '../core/css-block'
import type { Declaration } from '../core/css-declaration'
import type { RenderContext } from '../core/css-value'

export interface PropertyRule extends Block<Declaration<string, unknown>> {
  kind: 'property-rule'
  /** 不包含开头的 --。 */
  name: string
}

/** 累计自定义属性的注册描述符；交给 Root 后才提交注册。 */
export function propertyRule(name: string, ...body: Content<Declaration<string, unknown>>[]): PropertyRule {
  return block<PropertyRule>({
    kind: 'property-rule',
    name,
    body: [],
    parseCss(context?: RenderContext) {
      return `@property --${this.name} { ${this.body.map((declaration) => declaration.parseCss(context)).join('\n')} }`
    },
  }).of(...body)
}
