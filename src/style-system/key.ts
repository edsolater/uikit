/** JSS 声明目标的创建、识别与名称解析。 */
import { assert } from '@edsolater/fnkit'
import type { Value, ValueInput } from './value'

/** 原生属性名称。 */
export interface JSSKeyObject {
  toCSSString(): string
  /**
   * 同 Target／State 地址、同属性名有至少两项时，按声明顺序连接 Value；省略时默认生成逗号数组。保留输入 Value 即保留其声明位置的编译结果；改写 content 后新内容在结果位置编译。
   * @example
   * const $gap = key('gap', { join: values => valueSequence(...values) })
   * rules('.example', [[$gap, '2px'], [$gap, '3px']])
   * compileCSS().includes('gap: 2px 3px;') // true
   */
  join?: (values: Value[]) => ValueInput
}

/** 原生属性名称与可输出的自定义 Key。 */
export interface JSSKeyDefinition<K extends string = string> extends JSSKeyObject {
  name: K
}

/** 属性或变量声明目标。 */
export type JSSKey = JSSKeyObject | string

const names = new Map<string, JSSKeyDefinition>()

/** 将原生属性名转换为对象声明使用的驼峰名称。 */
function propertyAlias(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase())
}

/** 登记属性原名与对象声明别名；同名目标不允许静默改指其他属性。 */
export function registerJSSKey(target: JSSKeyDefinition): void {
  const aliases = target.name.startsWith('--') ? [target.name] : [...new Set([target.name, propertyAlias(target.name)])]
  for (const name of aliases) {
    const existing = names.get(name)
    assert(!existing || existing.name === target.name, `JSSKey 名称冲突：${name}。`)
  }
  for (const name of aliases) if (!names.has(name)) names.set(name, target)
}

/**
 * 创建属性 Key；name 是输出的 CSS 属性名，join 可改写重复声明的默认数组组合。
 * @example
 * const $stack = key('z-index', {
 *   join: values => values.reduce((sum, item) => sum + Number(item.content), 0),
 * })
 * rules('.example', [[$stack, 2], [$stack, 3]])
 * compileCSS().includes('z-index: 5;') // true
 */
export function key<K extends string>(name: K, options?: Pick<JSSKeyObject, 'join'>): JSSKeyDefinition<K> {
  const target: JSSKeyDefinition<K> = { name, toCSSString: () => name, ...options }
  registerJSSKey(target)
  return target
}

/** 识别声明目标。 */
export function isJSSKey(input: unknown): input is JSSKey {
  return typeof input === 'string' || (input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'toCSSString' in input && typeof input.toCSSString === 'function')
}

/** 解析对象与字符串条目中的声明名称；原生属性和自定义属性保持字符串入口。 */
export function resolveJSSKey(input: JSSKey): JSSKey {
  if (typeof input !== 'string') return input
  const registered = names.get(input)
  if (registered) return registered
  if ((input.startsWith('--') && input.length > 2) || /^-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input)) return input
  throw new Error(`未知 JSSKey 名称：${input}。`)
}

/** 取得原生属性名。 */
export function propertyName(key: JSSKey): string {
  return typeof key === 'string' ? key : key.toCSSString()
}
