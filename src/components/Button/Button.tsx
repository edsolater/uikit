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
import { createValidator, type ComponentProps } from './createValidator'

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
export interface ButtonProps extends ComponentProps {}
export interface ButtonProps extends ButtonStatusProps {}
export interface ButtonProps extends ButtonLabelProps {}

export function Button(props: ButtonProps) {
  const profile = createUIKitProfile(props)
  const label = createDescriptionManager(props)

  // status 驱动，由信息本身决定
  const status = createStatusManager<ButtonBusinessStatus>()

  // 信息是否符合规则， 会内部更改status
  const validator = createValidator({ props })

  const isLoading = state(props.loading).map(Boolean)
  const isDisabled = validator.isValid.map((valid) => !valid)
  const isIdle = state(() => val(validator.isValid) && !val(isLoading))
  status.setStatus('idle', isIdle)
  status.setStatus('loading', isLoading)
  status.setStatus('disabled', isDisabled)

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
