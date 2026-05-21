/**
 * 这个文件定义 Button 可用性判断能力。
 * 它负责把 disabled、enabled、status disabled 和 validIf 合并成最终禁用状态。
 * 它不负责 Button DOM、样式、点击行为或失败后的 props 改写。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import { val, type Source, type ReadableState, type State, state, createState } from '../../../hooks'


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
  isValid: ReadableState<boolean>
  isEnabled: State<boolean>
  isDisabled: ReadableState<boolean>
}

export function createValiditor(options: ValidityOptions): Validity {

  const isValid = state(options.validIf).map((validIf) => toArray(validIf).every(v => isValidationPassed(v)))

  const isEnabled = createState(() => {
    if (!val(isValid)) return false
    if (options.enabled !== undefined) return val(options.enabled) === true
    if (val(options.disabled)) return false
    return true
  })

  return {
    isValid,
    isEnabled,
    isDisabled: isEnabled.map(v => !v),
  }
}

function isValidationPassed(input: ValidationInput): boolean {
  const validation = val(input)
  if (validation === undefined) return true
  if (typeof validation === 'boolean') return validation
  return val(validation.should) === true
}
