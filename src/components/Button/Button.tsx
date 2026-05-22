/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createStatusManager } from '../../component-utils/status'
import { state, val, type Source } from '../../hooks'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createDescriptionManager, type ButtonLabelProps } from './createButtonLabelManager'
import { createUIKitProfile, type ButtonProfileProps } from './createButtonProfile'
import { createValidator, type ButtonValidityOptions } from './createButtonValidator'

export type ButtonStatus = 'idle' | 'loading' | 'disabled' | 'hover' | 'active' | 'focus-visible'
export type ButtonBusinessStatus = 'idle' | 'loading' | 'disabled'
// 交互状态由 CSS 伪类驱动，不进入 createStatusManager 的业务状态记录。
export type ButtonInteractionStatus = 'hover' | 'active' | 'focus-visible'

export type ButtonStatusProps = {
  /**
   * 动作已经触发，正在执行。
   */
  loading?: Source<boolean>
}

// 这种写法是为了让 props 声明更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'> {}
export interface ButtonProps extends ButtonProfileProps {}
export interface ButtonProps extends ButtonValidityOptions {}
export interface ButtonProps extends ButtonStatusProps {}
export interface ButtonProps extends ButtonLabelProps {}

export function Button(props: ButtonProps) {
  const profile = createUIKitProfile(props)
  const label = createDescriptionManager(props)

  const validator = createValidator(props)
  const status = createStatusManager<ButtonBusinessStatus>()

  // status 驱动
  const isLoading = state(() => val(props.loading) === true)
  const isDisabled = validator.isValid.map((valid) => !valid)
  const isIdle = state(() => val(validator.isValid) && !val(isLoading))
  status.actions.setStatus('idle', isIdle)
  status.actions.setStatus('loading', isLoading)
  status.actions.setStatus('disabled', isDisabled)

  return (
    <Piv
      as="button"
      shadowProps={props}
      class="Button"
      plugins={[profile.plugin, validator.plugin, label.plugin, status.plugin]}
    >
      {props.children}
    </Piv>
  )
}
