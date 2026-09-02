/**
 * 这个文件定义 Input 的有效性判断能力。
 * 它负责把 invalid 和 validIf 合并成最终 isValid 状态。
 * 它不负责 Input DOM、样式或值同步策略。
 */
import { isObject } from '@edsolater/fnkit'
import { stateView, val, type MayArraySource, type Source, type StateView } from '../../../hooks'
import type { StatusProps } from '../utils/parseStatusProps'

export type ValidationRule = {
  /** 验证条件；返回 true 时通过。 */
  should: Source<boolean>
}

export type ValidationInput = Source<boolean | ValidationRule | undefined>

export type ValidIf = MayArraySource<boolean | ValidationRule>

export type InputValidityProps = StatusProps<'invalid'> & {
  /** 所有条件都通过时输入框才视为有效。 */
  validIf?: ValidIf
}

export type InputValidity = {
  isValid: StateView<boolean>
}

export function createInputValidity(props: InputValidityProps): InputValidity {
  const allRulesPassed = stateView(props.validIf).map((validIf) => {
    const validationInputs = validIf === undefined
      ? []
      : Array.isArray(validIf)
        ? validIf
        : [validIf]
    return validationInputs.every(isValidationPassed)
  })

  const isValid = allRulesPassed.map((areAllRulesPassed) => {
    if (!areAllRulesPassed) return false
    if (props.invalid !== undefined) return val(props.invalid) !== true
    return true
  })

  return {
    isValid,
  }
}

function isValidationPassed(input: ValidationInput): boolean {
  const validationInput = val(input)
  if (isObject(validationInput)) {
    return val(validationInput.should) === true
  }
  return Boolean(validationInput)
}
