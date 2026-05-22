/**
 * 这个文件定义 Button 可用性判断能力。
 * 它负责把 disabled、enabled 和 validIf 合并成最终有效性状态。
 * 它不负责 Button DOM、样式、点击行为或失败后的 props 改写。
 */
import { isObject, toArray, type MayArray } from '@edsolater/fnkit'
import { createPivPlugin } from '../BasicPiv/plugin/helpers'
import type { PivPlugin } from '../BasicPiv/plugin/runPlugin'
import { createState, val, type Source, type State } from '../../hooks'
import type { StatusRecordManager } from '../../component-utils/status'

export type ValidationRule = {
  /**
   * 验证条件；返回 true 时通过。
   */
  should: Source<boolean>
}

export type ValidationInput = Source<boolean | ValidationRule | undefined>

export type ValidIf = Source<MayArray<ValidationInput> | undefined>

export type ComponentProps = {
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

export type ButtonValidity = {
  isValid: State<boolean>
  plugin: PivPlugin<'button'>
}

export function createValidator(options: {
  props: ComponentProps
}): ButtonValidity {
  const { props } = options
  const allRulesPassed = createState(() => toArray(val(props.validIf)).every((input) => isValidationPassed(input)))
  const isValid = createState(() => {
    if (!val(allRulesPassed)) return false
    if (props.enabled !== undefined) return val(props.enabled) === true
    if (val(props.disabled)) return false
    return true
  })
  
  const validityPlugin = createPivPlugin<'button'>(() => ({
    htmlProps: {
      disabled: isValid.map((valid) => !valid),
    },
  }))

  return {
    isValid,
    plugin: validityPlugin,
  }
}

function isValidationPassed(input: ValidationInput): boolean {
  const validationInput = val(input)
  if (isObject(validationInput)) {
    return val(validationInput.should) === true
  }
  return Boolean(validationInput)
}
