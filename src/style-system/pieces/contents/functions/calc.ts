/**
 * CSS 数值计算的内容组织。
 *
 * 组合操作数，在输出阶段生成 CSS 算术表达式。
 *
 * 变化回调和其他内容组合使用同一份 CSS 算术语义。
 */
import { token, type Token, type TokenInput } from '../../../token'

/**
 * 延迟生成 calc 乘法，数值与单位由浏览器解释。
 */
export const multiply = (
  amount: TokenInput,
  factor: TokenInput,
): Token<[TokenInput, TokenInput]> => calculate(amount, factor, '*')

/**
 * 延迟生成 calc 加法，数值与单位由浏览器解释。
 */
export const add = (
  amount: TokenInput,
  change: TokenInput,
): Token<[TokenInput, TokenInput]> => calculate(amount, change, '+')

/**
 * 保存两侧操作数与依赖，在输出时生成 calc 文本。
 */
const calculate = (
  amount: TokenInput,
  change: TokenInput,
  operator: '+' | '*',
): Token<[TokenInput, TokenInput]> =>
  token<[TokenInput, TokenInput]>(
    { default: [amount, change] },
    {
      dependencies: (inputs) => inputs,
      toCSSString: ([amount, change], resolve) => {
        const left = resolve(amount)
        const right = resolve(change)
        return left === undefined || right === undefined
          ? undefined
          : `calc(${left} ${operator} ${right})`
      },
    },
  )
