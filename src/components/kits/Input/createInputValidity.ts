/**
 * 这个文件定义 Input 的有效性判断能力。
 * 它负责把 invalid 和 validIf 合并成最终 isValid 状态。
 * 它不负责 Input DOM、样式或值同步策略。
 */
import { isObject, toArray } from '@edsolater/fnkit'
import { createState, toStateView, val, type MayArraySource, type Source, type State } from '../../../hooks'

export type ValidationRule = {
  /**
   * 验证条件；返回 true 时通过。
   */
  should: Source<boolean>
}

export type ValidationInput = Source<boolean | ValidationRule | undefined>

export type ValidIf = MayArraySource<boolean | ValidationRule>

export type ValidityOptions = {
  /**
   * 显式无效入口；true 时输入框标记为 invalid。
   */
  invalid?: Source<boolean>

  /**
   * 更强的验证入口；所有条件都通过时输入框才视为 valid。
   */
  validIf?: ValidIf
}

export type Validity = {
  isValid: State<boolean>
}

export function createValiditor(options: ValidityOptions): Validity {
  const allRulesPassed = toStateView(options.validIf).map((validIf) => toArray(validIf).every((v) => isValidationPassed(v)))

  const isValid = createState(() => {
    if (!val(allRulesPassed)) return false
    if (options.invalid !== undefined) return val(options.invalid) !== true
    return true
  })

  return {
    isValid,
  }
}

function isValidationPassed(input: ValidationInput): boolean {
  const validationInput = val(input)
  if (isObject(validationInput)) {
    const rule = validationInput
    return val(rule.should) === true
  }
  return Boolean(validationInput)
}
