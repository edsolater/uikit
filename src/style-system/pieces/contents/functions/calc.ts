/** CSS 数值计算的内容组织。
 *
 * 组合操作数，在输出阶段生成 CSS 算术表达式。
 *
 * 变化回调和其他内容组合使用同一份 CSS 算术语义。
 */
import { createJSSContent, type Expression } from '../../../content'
import type { ValueInput } from '../../../value'

/**
 * 延迟生成 calc 乘法，数值与单位由浏览器解释。
 */
export const multiply = (amount: ValueInput, factor: ValueInput): Expression => calculate(amount, factor, '*')

/**
 * 延迟生成 calc 加法，数值与单位由浏览器解释。
 */
export const add = (amount: ValueInput, change: ValueInput): Expression => calculate(amount, change, '+')

/**
 * 保存两侧操作数与依赖，在输出时生成 calc 文本。
 */
const calculate = (amount: ValueInput, change: ValueInput, operator: '+' | '*'): Expression =>
  createJSSContent((resolve) => {
    const left = resolve(amount)
    const right = resolve(change)
    return left === undefined || right === undefined ? undefined : `calc(${left} ${operator} ${right})`
  }, [amount, change])
