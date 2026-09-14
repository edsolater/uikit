/** 自定义属性的 @property 注册规则。 */
import { flattenContent, type Block, type Content } from '../css-block'
import type { Declaration } from '../css-declaration'
import type { RenderContext } from '../css-value'

export interface PropertyRule extends Block {
  readonly kind: 'property-rule'
  /** 不包含开头的 --。 */
  readonly name: string
  readonly body: readonly Declaration[]
}

/** 自定义属性的注册描述符；此处只组成规则，交给 Root 后才注册。 */
export function propertyRule(name: string, ...body: Content<Declaration>[]): PropertyRule {
  return {
    kind: 'property-rule',
    name,
    body: flattenContent<Declaration>(body),
    parseCss(context?: RenderContext) {
      return `@property --${this.name} { ${this.body.map((declaration) => declaration.parseCss(context)).join('\n')} }`
    },
  }
}
