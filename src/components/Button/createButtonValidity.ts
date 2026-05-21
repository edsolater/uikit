/**
 * 这个文件定义 Button 可用性判断能力。
 * 它负责把 disabled、enabled、status disabled 和 validIf 合并成最终禁用状态。
 * 它不负责 Button DOM、样式、点击行为或失败后的 props 改写。
 */
import { isObject, toArray, type MayArray } from '@edsolater/fnkit'
import { createState, state, val, type Source, type State } from '../../hooks'

export type ValidationRule = {
  /**
   * 验证条件；返回 true 时通过。
   */
  should: Source<boolean>
}

export type ValidationInput = Source<boolean | ValidationRule | undefined>

export type ValidIf = Source<MayArray<ValidationInput> | undefined>

export type ValidityOptions = {
  /**
   * 快捷禁用入口；true 时按钮不可用。
   */
  disabled?: Source<boolean>

  /**
   * 显式可用入口；传入时必须为 true 才允许按钮可用。
   */
  enabled?: Source<boolean>

  /**
   * 更强的验证入口；所有条件都通过时按钮才可用。
   */
  validIf?: ValidIf
}

export type Validity = {
  isValid: State<boolean>
}

export function createValiditor(options: ValidityOptions): Validity {
  const allRulesPassed = state(options.validIf).map((validIf) => toArray(validIf).every((v) => isValidationPassed(v)))

  const isValid = createState(() => {
    if (!val(allRulesPassed)) return false
    if (options.enabled !== undefined) return val(options.enabled) === true
    if (val(options.disabled)) return false
    return true
  })

  return {
    isValid,
  }
}

/**
 * 判断单条验证输入是否通过。
 *
 * - 如果输入是布尔值，直接判断真值。
 * - 如果输入是对象，读取其 `should` 字段并判断真值。
 * - 其他情况视为不通过。
 *
 * 该函数用于 `createValiditor` 内部处理 `validIf` 条件。
 */
function isValidationPassed(input: ValidationInput): boolean {
  const validationInput = val(input)
  if (isObject(validationInput)) {
    const rule = validationInput
    return val(rule.should) === true
  }
  return Boolean(validationInput)
}
