/** 盒阴影属性。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { parseValue, type Value } from '../core/css-value'
import type { Shadow } from '../values/shadow'
import { formatCommaList } from '../formatters/comma-list'

export const boxShadowKey = key('box-shadow')

/** 盒阴影属性声明；内容可以是独立阴影列表，也可以是完整值引用。 */
export interface BoxShadowDeclaration extends Declaration<'box-shadow', Shadow[] | Value | string> {
  /** 追加完整阴影；只用于以阴影列表构造的属性，不拆解变量或关键字。 */
  append(...shadows: Shadow[]): this
}

/**
 * 盒阴影，可使用变量、关键字或直接配置多条阴影。
 * @example
 * boxShadow(shadowValue({ x: '0', y: '2px', blur: '4px', color: 'black' })).parseCss()
 * // box-shadow: 0 2px 4px black;
 */
export function boxShadow(...inputs: [Value | string] | [Shadow, ...Shadow[]]): BoxShadowDeclaration {
  const first = inputs[0]
  const content = typeof first === 'string' || !('x' in first && 'y' in first) ? first : inputs as Shadow[]
  return Object.assign(
    declaration(boxShadowKey, content, (content, context) =>
      Array.isArray(content) ? formatCommaList(content, parseValue, context) : parseValue(content, context),
    ),
    {
      append(this: BoxShadowDeclaration, ...shadows: Shadow[]) {
        if (!Array.isArray(this.content)) throw new TypeError('当前内容不是阴影列表；需要追加时，请在构造处传入各条阴影。')
        this.content.push(...shadows)
        return this
      },
    },
  )
}
