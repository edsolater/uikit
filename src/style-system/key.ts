/** JSS 声明目标。

创建、识别和解析声明目标。

属性别名由此模块统一登记。
*/
import { assert, hasProperty, isFunction, isString } from '@edsolater/fnkit'
import type { ContentView } from './content'
import { isToken, type Token, type TokenInput } from './token/core'
import { cssTokenName } from './token/css'

/** 原生属性名称。 */
export interface JSSKeyObject {
  toCSSString(): string
  /** 同完整地址的声明等级；普通 Key 省略时为最高档 999。 */
  priority?: number
  /**
   * 同 Target／State 地址、同属性名有至少两项时，按声明顺序连接内容贡献；省略时默认生成逗号数组。保留输入视图 即保留其声明位置的编译结果；改写 content 后新内容在结果位置编译。
   */
  join?: (values: ContentView[]) => TokenInput
}

/** 原生属性名称与可输出的自定义 Key。 */
export interface JSSKeyDefinition<
  K extends string = string,
> extends JSSKeyObject {
  name: K
}

/** 属性或变量声明目标。 */
export type JSSKey = JSSKeyObject | Token | string

/**
 * 创建属性 Key；name 是输出的 CSS 属性名，join 可改写重复声明的默认数组组合。
 * @example
 * const $stack = key('z-index', {
 *   join: values => values.reduce((sum, item) => sum + Number(item.content), 0),
 * })
 * rules('.example', [[$stack, 2], [$stack, 3]])
 * compileCSS().includes('z-index: 5;') // true
 */
export function key<K extends string>(
  name: K,
  options?: Pick<JSSKeyObject, 'join'>,
): JSSKeyDefinition<K> {
  const target: JSSKeyDefinition<K> = {
    name,
    toCSSString: () => name,
    ...options,
  }
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
  const aliases = target.name.startsWith('--')
    ? [target.name]
    : [
        ...new Set([
          target.name,
          target.name.replace(/-([a-z0-9])/g, (_, character: string) =>
            character.toUpperCase(),
          ),
        ]),
      ]
  for (const name of aliases) {
    const existing = names.get(name)
    assert(
      !existing || existing.name === target.name,
      `JSSKey 名称冲突：${name}。`,
    )
  }
  for (const name of aliases) if (!names.has(name)) names.set(name, target)
}

/** 解析对象与字符串条目中的声明名称；原生属性和自定义属性保持字符串入口。 */
export function resolveJSSKey(input: JSSKey): JSSKey {
  if (!isString(input)) return input
  const registered = names.get(input)
  if (registered) return registered
  if (
    (input.startsWith('--') && input.length > 2) ||
    /^-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input)
  )
    return input
  throw new Error(`未知 JSSKey 名称：${input}。`)
}

/**
 * 读取并校验声明属性名，拒绝输出协议返回函数等非文本内容。
 */
export function propertyName(key: JSSKey): string {
  const name = isString(key)
    ? key
    : isToken(key)
      ? cssTokenName(key)
      : key.toCSSString()
  assert(isString(name), 'JSSKey 的 toCSSString 必须返回属性名字符串。')
  return name
}

/**
 * 读取声明键的有效等级；字符串与普通 Key 默认使用999，内容对象同样读取自身等级。
 */
export const keyPriority = (key: JSSKey | undefined): number =>
  key !== undefined && typeof key !== 'string'
    ? (('priority' in key ? key.priority : undefined) ?? 999)
    : 999
