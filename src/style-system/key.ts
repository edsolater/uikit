/**
 * JSS 声明目标的识别与名称解析。
 *
 * 从全局注册表解析属性名，并处理显式扩展登记。
 *
 * 让字符串声明使用明确的属性身份。
 */
import { assert, hasProperty, isFunction, isString } from '@edsolater/fnkit'
import { keyRegistry } from '@/style-system/key-registry'
import type { JSSKeyDefinition, JSSKeyObject } from './key-definition'
import { isToken, type Token } from './token/core'
import { cssTokenName } from './token/css'

export { key, type JSSKeyDefinition, type JSSKeyObject } from './key-definition'

/** 属性或变量声明目标。 */
export type JSSKey = JSSKeyObject | Token | string

/**
 * 识别字符串或具有 CSS 输出协议的声明目标。
 */
export const isJSSKey = (input: unknown): input is JSSKey =>
  isString(input) || hasProperty(input, 'toCSSString', isFunction)

/**
 * 按原名或已知 camelCase 别名查找目标；混合拼写不产生别名。
 */
function registeredKey(name: string): JSSKeyDefinition | undefined {
  if (Object.hasOwn(keyRegistry, name)) return keyRegistry[name]
  if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) return undefined
  const cssName = name.replace(/[A-Z]/g, (character) =>
    '-' + character.toLowerCase(),
  )
  return Object.hasOwn(keyRegistry, cssName) ? keyRegistry[cssName] : undefined
}

/**
 * 显式登记属性原名与别名；冲突时整体拒绝，同一原名保留首个对象。
 */
export function registerGlobalJSSKeyInStorage(target: JSSKeyDefinition): void {
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
    const existing = registeredKey(name)
    assert(
      !existing || existing.name === target.name,
      'JSSKey 名称冲突：' + name + '。',
    )
  }
  const registered = registeredKey(target.name) ?? target
  for (const name of aliases)
    if (!Object.hasOwn(keyRegistry, name)) keyRegistry[name] = registered
}

/**
 * 解析声明目标；未知合法原生名和自定义属性直通，未知别名报错。
 */
export function resolveJSSKey(input: JSSKey): JSSKey {
  if (!isString(input)) return input
  const registered = registeredKey(input)
  if (registered) return registered
  if (
    (input.startsWith('--') && input.length > 2) ||
    /^-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input)
  )
    return input
  throw new Error('未知 JSSKey 名称：' + input + '。')
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
 * 读取声明键的有效等级；字符串与普通 Key 默认使用 999，
 * 内容对象同样读取自身等级。
 */
export const keyPriority = (key: JSSKey | undefined): number =>
  key !== undefined && typeof key !== 'string'
    ? (('priority' in key ? key.priority : undefined) ?? 999)
    : 999
