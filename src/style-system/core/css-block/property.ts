/** 自定义属性的 @property 注册规则。 */
import type { Block } from '../css-block'
import type { Declaration } from '../css-declaration'
import type { RenderContext } from '../css-value'

export interface PropertyRule extends Block {
  readonly kind: 'property-rule'
  /** 不包含开头的 --。 */
  readonly name: string
  readonly body: readonly Declaration[]
}

export function propertyRule(name: string, body: readonly Declaration[]): PropertyRule {
  return {
    kind: 'property-rule', name, body: [...body],
    parseCss(context?: RenderContext) {
      return `@property --${this.name} { ${this.body.map(declaration => declaration.parseCss(context)).join('\n')} }`
    },
  }
}
