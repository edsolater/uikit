/** CSS 声明目标。 */
import { isVariable, type Variable } from './css-variable'

/** 原生属性名称。 */
export interface Key<K extends string = string> {
  name: K
}

/** 属性或变量声明目标。 */
export type CSSKey = Key | string | Variable

const names = new Map<string, Key>()

/** 将原生属性名转换为对象声明使用的驼峰名称。 */
function propertyAlias(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase())
}

/** 登记属性原名与对象声明别名；同名目标不允许静默改指其他属性。 */
export function registerCSSKey(target: Key): void {
  const aliases = target.name.startsWith('--') ? [target.name] : [...new Set([target.name, propertyAlias(target.name)])]
  for (const name of aliases) {
    const existing = names.get(name)
    if (existing && existing.name !== target.name) throw new Error(`CSS Key 名称冲突：${name}。`)
  }
  for (const name of aliases) if (!names.has(name)) names.set(name, target)
}

/** 创建 CSS Key。 */
export function key<K extends string>(name: K): Key<K> {
  const target: Key<K> = { name }
  registerCSSKey(target)
  return target
}

/** 识别声明目标。 */
export function isCSSKey(input: unknown): input is CSSKey {
  return typeof input === 'string' || isVariable(input)
    || (typeof input === 'object' && input !== null && !('kind' in input)
      && 'name' in input && typeof input.name === 'string')
}

/** 解析对象与字符串条目中的声明名称；原生属性和自定义属性保持字符串入口。 */
export function resolveCSSKey(input: CSSKey): CSSKey {
  if (typeof input !== 'string') return input
  const registered = names.get(input)
  if (registered) return registered
  if ((input.startsWith('--') && input.length > 2) || /^-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input)) return input
  throw new Error(`未知 CSS Key 名称：${input}。`)
}

/** 取得原生属性名。 */
export function propertyName(key: CSSKey): string {
  return typeof key === 'string' ? key : isVariable(key) ? `--${key.name}` : key.name
}
