/** 按需定义的 CSS 函数值。 */
import { functionDefinition } from '../../core/css-condition'
import type { Rules } from '../../core/css-rule'
import type { Value, ValueInput } from '../../core/css-value'

/** 创建 CSS 函数 Value 工厂；函数调用被消费时提供完整定义。 */
export function cssFunction(signature: string, body: Rules): (...args: ValueInput[]) => Value {
  const target = functionDefinition(signature)
  const name = signature.split('(')[0].trim()
  const definition: Rules = new Map([[[[target], undefined], body]])
  return (...args) => ({
    kind: 'value',
    expression: { type: 'function', name, arguments: args },
    /** 提供本次编译的函数定义。 */
    onActive: () => definition,
  })
}
