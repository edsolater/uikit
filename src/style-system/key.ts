/** JSS 声明目标与 CSS 自定义属性命名。

创建、识别和解析声明目标，统一分配自定义属性名称。

Variable、Modification 和绑定结果共享 CSS 名称空间，属性别名登记保持独立。
*/
import { assert, hasProperty, IdGenerator, isFunction, isString } from '@edsolater/fnkit'
import type { Value, ValueInput } from './value'

/** 原生属性名称。 */
export interface JSSKeyObject {
  toCSSString(): string
  /**
   * 同 Target／State 地址、同属性名有至少两项时，按声明顺序连接 Value；省略时默认生成逗号数组。保留输入 Value 即保留其声明位置的编译结果；改写 content 后新内容在结果位置编译。
   */
  join?: (values: Value[]) => ValueInput
}

/** 原生属性名称与可输出的自定义 Key。 */
export interface JSSKeyDefinition<K extends string = string> extends JSSKeyObject {
  name: K
}

/** 属性或变量声明目标。 */
export type JSSKey = JSSKeyObject | string

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
export const isJSSKey = (input: unknown): input is JSSKey =>
  isString(input) || hasProperty(input, 'toCSSString', isFunction)

const names = new Map<string, JSSKeyDefinition>()

/**
 * 登记属性原名与对象声明别名；同名目标不允许静默改指其他属性。
 */
export function registerJSSKey(target: JSSKeyDefinition): void {
  const aliases = target.name.startsWith('--') ? [target.name] : [...new Set([
    target.name, target.name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase()),
  ])]
  for (const name of aliases) {
    const existing = names.get(name)
    assert(!existing || existing.name === target.name, `JSSKey 名称冲突：${name}。`)
  }
  for (const name of aliases) if (!names.has(name)) names.set(name, target)
}

/** 解析对象与字符串条目中的声明名称；原生属性和自定义属性保持字符串入口。 */
export function resolveJSSKey(input: JSSKey): JSSKey {
  if (!isString(input)) return input
  const registered = names.get(input)
  if (registered) return registered
  if ((input.startsWith('--') && input.length > 2) || /^-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input)) return input
  throw new Error(`未知 JSSKey 名称：${input}。`)
}

/** 取得原生属性名。 */
export const propertyName = (key: JSSKey): string => isString(key) ? key : key.toCSSString()

/** Variable 与 Modification 共用的临时名称序号，仅在缺少名称时分配。 */
const nameGenerator = new IdGenerator('temp')
/** 已用于变量或变化声明的名称；自动分配避让显式名称，显式同名仍允许 CSS 局部覆盖。 */
const usedNames = new Set<string>()

/**
 * 分配同一 CSS 自定义属性命名空间中的名称；匿名名称避让已登记的显式名称。
 * 显式同名保留，用于 CSS 局部覆盖；返回名称保留调用者传入的 -- 前缀。
 */
export function allocateVariableName(name?: string): string {
  if (name === undefined) {
    do { name = `temp-${nameGenerator.genID()}` } while (usedNames.has(name))
  }
  usedNames.add(name.replace(/^--/, ''))
  return name
}
