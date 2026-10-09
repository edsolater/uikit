/** CSS Declaration 的声明入口。

配对 Key 与内容，或消费信息体天然持有的声明材料。

声明与修改使用同一目标身份，交给编译器按条件消费。
*/
import { isJSSKey, type JSSKey } from './key'
import type { ValueInput } from './value'
import { assert, hasProperty, isArray, isFunction, isNumber, isString, isUndefined, matchShape, or, type DataShape } from '@edsolater/fnkit'
import { isJSSContent } from './content'
import { declareVariable } from './variable-modify'
import { resolveVariable } from './variable-cluster'

/** 一条 `[Key, content]` 声明；undefined content 表示无效。 */
export type Declaration<C = ValueInput | undefined> = [key: Exclude<JSSKey, string>, content: C]

/** 声明操作需要的目标与内容；信息体无需实现声明操作。 */
export interface DeclareProtocol {
  key: Exclude<JSSKey, string>
  /** 内容生产函数在编译消费时执行；undefined 表示不输出。 */
  content: ValueInput | (() => ValueInput)
  /** 共同声明的依赖材料；覆盖自身内容时仍保留这些关系。 */
  declarations?: DeclareProtocol[]
}

/** 声明材料的字段形状；入口另检查 content 存在，显式 undefined 表示无输出。 */
export const declareShape = {
  key: { toCSSString: isFunction },
  content: or(isString, isNumber, isUndefined, isFunction, isJSSContent),
} satisfies DataShape

/**
 * 判断输入是否是 Declaration。
 */
export const isCSSPair = (input: unknown): input is [JSSKey, unknown] =>
  isArray(input) && input.length === 2 && isJSSKey(input[0])

/**
 * 声明 key/content 材料或局部覆盖；自定义属性建立后续修改使用的基础声明。
 * 其他 Key 直接配对内容，不要求材料具有 Variable 身份。
 */
export function declare(target: DeclareProtocol, content?: ValueInput | (() => ValueInput)): Declaration
export function declare<C = ValueInput | undefined>(key: Exclude<JSSKey, string>, content: C): Declaration<C>
export function declare(key: DeclareProtocol | Exclude<JSSKey, string>, ...contents: unknown[]): Declaration<unknown> {
  if (hasProperty(key, 'content') && matchShape(key, declareShape)) {
    const target = resolveVariable(key as DeclareProtocol)
    const content = (contents.length ? contents[0] : target.content) as DeclareProtocol['content']
    const name = target.key.toCSSString()
    assert(isString(name), 'declare 的 CSS Key 需要输出字符串。')
    return name.startsWith('--') ? declareVariable(target, content) : [target.key, content]
  }
  assert(isJSSKey(key), 'declare 需要 key/content 材料或有效 CSS Key。')
  return [key, contents[0]]
}
