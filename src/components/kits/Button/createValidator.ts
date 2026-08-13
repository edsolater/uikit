/**
 * 这个文件定义 Button 可用性判断能力。
 * 它负责把 disabled、enabled 和 validIf 合并成最终有效性状态。
 * 它不负责 Button DOM、样式、点击行为或失败后的 props 改写。
 */
import { isObject, toArray } from '@edsolater/fnkit'
import { createState, val, type MayArraySource, type Source, type State } from '../../../hooks'
import { createPivPlugin } from '../Piv/plugin/helpers'
import type { PivPlugin } from '../Piv/plugin/runPlugin'

export type ValidatorRule = {
  /**
   * 验证条件；返回 true 时通过。
   */
  should: Source<boolean>
}

export type ValidatorInput = Source<boolean | ValidatorRule | undefined>

export type ValidIf = MayArraySource<boolean | ValidatorRule>

export type ValidatorProps = {
  /**
   * 动作当前不可触发。
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

export type ButtonValidator = {
  details: {
    isValid: State<boolean>
  }
  plugin: PivPlugin<'button'>
}

export function createValidator(options: { props: ValidatorProps }): ButtonValidator {
  const { props } = options
  const allRulesPassed = createState(() => toArray(val(props.validIf)).every((input) => isValidationPassed(input)))
  const isValid = createState(() => {
    if (!val(allRulesPassed)) return false
    if (props.enabled !== undefined) return val(props.enabled) === true
    if (val(props.disabled)) return false
    return true
  })

  const validitorPlugin = createPivPlugin<'button'>(() => ({
    htmlProps: {
      disabled: isValid.map((valid) => !valid),
    },
  }))

  const validitorState = {
    isValid,
  }

  return {
    details: validitorState,
    plugin: validitorPlugin,
  }
}

function isValidationPassed(input: ValidatorInput): boolean {
  const validationInput = val(input)
  if (isObject(validationInput)) {
    return val(validationInput.should) === true
  }
  return Boolean(validationInput)
}
