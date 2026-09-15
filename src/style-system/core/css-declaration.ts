/** 带有明确目的的样式声明；内部 Role 决定输出一条还是多条属性。 */
import type { Key } from './css-key'
import { parseValue, type RenderContext, type Value } from './css-value'

/**
 * 声明内部的完整输出规则，不是交给 Block 的另一种节点。
 * @example
 * const sides: DeclarationRole<string> = {
 *   parseCss(_name, distance) { return `margin-top: ${distance};\nmargin-bottom: ${distance};` },
 * }
 * declaration('vertical-margin', '4px', sides).parseCss()
 * // margin-top: 4px;\nmargin-bottom: 4px;
 */
export interface DeclarationRole<C> {
  /** 输出完整声明；访问子 Value 时须传递同一 context。 */
  parseCss(name: string, content: C, context?: RenderContext): string
}

export interface Declaration<N extends string = string, C = Value | string> {
  kind: 'declaration'

  /** 声明目的，例如 padding；不要求它与输出的每个长属性同名。 */
  name: N
  content: C
  role: DeclarationRole<C>
  parseCss(context?: RenderContext): string
}

/**
 * 普通属性提供 Key 与值；复合属性可提供内容解析函数或完整 Role。
 * @example declaration(key('color'), 'red').parseCss() // color: red;
 * @example
 * declaration(key('font-size'), { size: value('16px') }, (content, context) => parseValue(content.size, context)).parseCss()
 * // font-size: 16px;
 */
export function declaration<N extends string>(name: Key<N> | N, content: Value | string): Declaration<N>
export function declaration<N extends string, C>(
  name: Key<N> | N,
  content: C,
  role: DeclarationRole<C> | ((content: C, context?: RenderContext) => string),
): Declaration<N, C>
export function declaration<N extends string, C>(
  name: Key<N> | N,
  content: C,
  role?: DeclarationRole<C> | ((content: C, context?: RenderContext) => string),
): Declaration<N, C> {
  const contentParser = typeof role === 'function' ? role : undefined
  return {
    kind: 'declaration',
    name: typeof name === 'string' ? name : name.name,
    content,
    role: typeof role === 'object' ? role : {
      parseCss(name, content, context) {
        // 省略第三个参数的重载只接受 Value 或字符串。
        const css = contentParser ? contentParser(content, context) : parseValue(content as Value | string, context)
        return `${name}: ${css};`
      },
    },
    parseCss(context) {
      return this.role.parseCss(this.name, this.content, context)
    },
  }
}
