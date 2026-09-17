/** 自定义 CSS 函数的定义是 Rule，调用是带依赖的普通 Value。 */
import { atFunction } from '../../core/css-condition'
import type { Rules } from '../../core/css-rule'
import type { Value, ValueInput } from '../../core/css-value'

/**
 * 把签名和 Rules 函数体保存为可调用的 Value 工厂；创建工厂或调用它都不登记函数定义。
 * 只有调用产生的 Value 被编译访问时，才把完整 @function 定义作为本次编译依赖提交。
 * @example
 * const body: Rules = new Map([[[undefined, 'result'], 'calc(var(--size) * 2)']])
 * const double = cssFunction('--double(--size <length>) returns <length>', body)
 * double('4px') // 编译为 --double(4px)，并带上上述 @function 定义。
 */
export function cssFunction(signature: string, body: Rules): (...args: ValueInput[]) => Value {
  const target = atFunction(signature)
  const name = signature.split('(')[0].trim()
  const definition: Rules = new Map([[[[target], undefined], body]])
  return (...args) => ({
    kind: 'value',
    expression: { type: 'function', name, arguments: args },
    /** 交回本工厂共享的完整函数定义，由编译器登记到本次输出。 */
    onActive: () => definition,
  })
}
