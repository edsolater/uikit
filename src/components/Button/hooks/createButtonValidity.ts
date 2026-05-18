/**
 * 这个文件定义 Button 可用性判断能力。
 * 它负责把 disabled、enabled、status disabled 和 validIf 合并成最终禁用状态。
 * 它不负责 Button DOM、样式、点击行为或失败后的 props 改写。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import { createMemo, type Accessor } from 'solid-js'
import { $, derive, type MayState } from '../../../hooks'
import { flip } from '../../../hooks/base-state/read'

export type ValidationRule = {
  /**
   * 验证条件；返回 true 时通过。
   */
  should: MayState<boolean>
}

export type ValidationInput = MayState<boolean | ValidationRule | undefined>

export type ValidIf = MayState<MayArray<ValidationInput> | undefined>

export type ValidityOptions = {
  /**
   * 快捷禁用入口；true 时按钮不可用。
   */
  disabled?: MayState<boolean>

  /**
   * 显式可用入口；传入时必须为 true 才允许按钮可用。
   */
  enabled?: MayState<boolean>

  /**
   * 更强的验证入口；所有条件都通过时按钮才可用。
   */
  validIf?: ValidIf
}

export type Validity = {
  isValid: Accessor<boolean>
  isEnabled: Accessor<boolean>
  isDisabled: Accessor<boolean>
}

export function createValiditor(options: ValidityOptions): Validity {
  const isValid = derive(options.validIf, (validIf) => toArray(validIf).every(isValidationPassed))

  const isEnabled = createMemo(() => {
    if (!isValid()) return false
    if (options.enabled !== undefined) return $(options.enabled) === true
    if ($(options.disabled)) return false
    return true
  })

  return {
    isValid,
    isEnabled,
    isDisabled: derive(isEnabled, flip),
  }
}

function isValidationPassed(input: ValidationInput): boolean {
  const validation = $(input)
  if (validation === undefined) return true
  if (typeof validation === 'boolean') return validation
  return $(validation.should) === true
}
