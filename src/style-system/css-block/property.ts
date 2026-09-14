/** 自定义属性的 @property 注册规则。 */
import { block, flattenContent, type Block, type Content } from '../core/css-block'
import type { Declaration } from '../core/css-declaration'
import type { RenderContext } from '../core/css-value'

export interface PropertyRule extends Block<Declaration> {
  kind: 'property-rule'
  /** 不包含开头的 --。 */
  name: string
}

/** 累计自定义属性的注册描述符；交给 Root 后才提交注册。 */
export function propertyRule(name: string, ...body: Content<Declaration>[]): PropertyRule {
  return block<PropertyRule>({
    kind: 'property-rule',
    name,
    body: flattenContent<Declaration>(body),
    parseCss(context?: RenderContext) {
      return `@property --${this.name} { ${this.body.map((declaration) => declaration.parseCss(context)).join('\n')} }`
    },
  })
}
