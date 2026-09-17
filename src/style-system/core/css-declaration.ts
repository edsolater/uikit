/** 把 CSS 属性与尚未取值的内容绑定成 Declaration，由编译器按属性语法生成最终声明。 */
import { propertyName, type CSSProperty, type Key } from './css-key'
import type { ValueInput } from './css-value'

/** 编译器支持的声明组合方式；它决定 content 是完整值还是需要排列、追加或扩写的结构。 */
export type DeclarationSyntax = 'value' | 'border' | 'font' | 'padding' | 'margin' | 'transition' | 'box-shadow'

/**
 * 一条尚未编译的 CSS 声明：property 选择输出位置，content 保留 Value 或结构内容，syntax 选择解读方式。
 * Declaration 可由 rules() 登记，但自身不写入 CSSRoot，也不生成 CSS string。
 */
export interface Declaration<N extends string = string, C = ValueInput> {
  kind: 'declaration'
  name: N
  property: CSSProperty
  content: C
  syntax: DeclarationSyntax
}

/**
 * 保存属性、内容及编译语法；不登记 Rule，也不读取内部 Value 或扩写简写属性。
 * 默认 value 语法把 content 作为完整 Value 保存；其他语法要求相应内容形状，通常由 padding、font 等构造器配对提供。
 * 此函数不校验 syntax 与 content 是否匹配，类型也不保证配对正确；错误配对可能在编译时失败或产生错误结果。
 * @example
 * declaration('color', 'red') // 保存 syntax: 'value'、content: 'red'，编译为 color: red。
 * declaration('padding', ['4px', '8px'], 'padding')
 * // 与 padding('4px', '8px') 保存的结构相同，编译为上/下 4px、右/左 8px。
 */
export function declaration<N extends string, C = ValueInput>(property: Key<N> | N, content: C, syntax?: DeclarationSyntax): Declaration<N, C>
export function declaration<C = ValueInput>(property: CSSProperty, content: C, syntax?: DeclarationSyntax): Declaration<string, C>
export function declaration(property: CSSProperty, content: unknown, syntax: DeclarationSyntax = 'value'): Declaration<string, unknown> {
  return { kind: 'declaration', name: propertyName(property), property, content, syntax }
}
