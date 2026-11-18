/**
 * Input 的响应式有效性计算。
 *
 * 将外部无效标记与校验条件合并成持续更新的 isValid 来源。
 *
 * 字段值、DOM 与提示呈现由各自组件负责。
 */
import { isObject } from '@edsolater/fnkit'
import { val } from '@/foundation'
import { derive } from '@/hooks'
import type {
  InputValidationInput,
  InputValidityProps,
  InputValidity,
} from './validity.prop'

/**
 * 根据输入条件持续计算最终有效性：所有 validIf 通过且外部 invalid 不为 true 时有效。
 * 结果只读，不回写调用方的条件或字段值。
 */
export function createInputValidity(props: InputValidityProps): InputValidity {
  const allRulesPassed = derive(props, s => {
    const validIf = val(s.validIf)
    const validationInputs =
      validIf === undefined ? [] : Array.isArray(validIf) ? validIf : [validIf]
    return validationInputs.every(isValidationPassed)
  })

  const isValid = derive(allRulesPassed, areAllRulesPassed => {
    if (!areAllRulesPassed) return false
    return val(props.invalid) !== true
  })

  return {
    isValid,
  }
}

/**
 * 读取单项布尔条件或规则的 should 来源，返回当前是否通过。
 */
function isValidationPassed(input: InputValidationInput): boolean {
  const validationInput = val(input)
  if (isObject(validationInput)) {
    return val(validationInput.should) === true
  }
  return Boolean(validationInput)
}
