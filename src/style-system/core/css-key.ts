/** CSS 声明目标。 */
import { isVariable, type Variable } from './css-variable'

/** 原生属性名称。 */
export interface Key<K extends string = string> {
  name: K
}

/** 属性或变量声明目标。 */
export type CSSKey = Key | string | Variable

/** 创建 CSS Key。 */
export function key<K extends string>(name: K): Key<K> {
  return { name }
}

/** 识别声明目标。 */
export function isCSSKey(input: unknown): input is CSSKey {
  return typeof input === 'string' || isVariable(input)
    || (typeof input === 'object' && input !== null && !('kind' in input)
      && 'name' in input && typeof input.name === 'string')
}

/** 取得原生属性名。 */
export function propertyName(key: CSSKey): string {
  return typeof key === 'string' ? key : isVariable(key) ? `--${key.name}` : key.name
}
