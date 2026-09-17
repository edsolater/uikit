/** 将普通 CSS 属性、描述符和可重定义 Variable 统一为 Declaration 与 Rule 使用的属性位置。 */
import type { Value } from './css-value'

/** 一个具名 CSS 属性或描述符，供 Declaration 保留精确字面量名称。 */
export interface Key<K extends string = string> {
  name: K
}

/** Declaration 可指向的属性位置：属性名、具名 Key，或作为 Custom Property 的 Variable。 */
export type CSSProperty = Key | string | (Extract<Value, { kind: 'value' }> & { name: string })

/** 保存普通属性名或描述符名，不校验浏览器支持情况。 */
export function key<const K extends string>(name: K): Key<K> {
  return { name }
}

/** 字符串和普通 Key 保留名称；Variable 统一补成一个 -- 前缀的 CSS 自定义属性名。 */
export function propertyName(property: CSSProperty): string {
  if (typeof property === 'string') return property
  return 'kind' in property ? `--${property.name.replace(/^--/, '')}` : property.name
}
