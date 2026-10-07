/** CSS Declaration 的声明入口。

配对 Key 与内容，并为 Variable 建立局部基础值。

声明与修改使用同一目标身份，交给编译器按条件消费。
*/
import { isJSSKey, type JSSKey } from './key'
import type { ValueInput } from './value'
import { declareVariable } from './variable-modify'
import { isVariable, type Variable, type VariableDefaultValue } from './variable'
import { resolveVariable } from './variable-cluster'
import { isArray, result } from '@edsolater/fnkit'

/** 一条 `[Key, content]` 声明；undefined content 表示无效。 */
export type Declaration<C = ValueInput | undefined> = [key: Exclude<JSSKey, string>, content: C]

/** 判断输入是否是 Declaration。 */
export const isCSSPair = (input: unknown): input is [JSSKey, unknown] =>
  isArray(input) && input.length === 2 && isJSSKey(input[0])

/** 在当前位置声明 Variable 基础值；省略内容使用默认值。其他 Key 配对其 CSS 内容。 */
export function declare(variable: Variable, content?: VariableDefaultValue): Declaration
export function declare<C = ValueInput | undefined>(key: Exclude<JSSKey, string>, content: C): Declaration<C>
export function declare(key: Exclude<JSSKey, string>, ...contents: unknown[]): Declaration<unknown> {
  if (isVariable(key)) {
    const variable = resolveVariable(key)
    return declareVariable(variable, (contents.length ? contents[0] : () => result(variable.config.defaultValue)) as VariableDefaultValue)
  }
  return [key, contents[0]]
}
