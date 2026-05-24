/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度、状态表达和基础样式入口，不负责主题系统、表单编排、状态判断、状态来源组装或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createStatusManager, type StatusProps } from '../../component-utils/status'
import { derive } from '../../hooks/createState/compose'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import { createPivPlugin } from '../BasicPiv/plugin/helpers'
import './button.css'
import { createUIKitProfile, type ButtonProfileProps } from './createButtonProfile'

export type ButtonStatus = 'idle' | 'loading' | 'disabled' | 'hover' | 'active' | 'focus-visible'
export type ButtonBusinessStatus = 'idle' | 'loading' | 'disabled'
// 交互状态由 CSS 伪类驱动，不进入 createStatusManager 的业务状态记录。
export type ButtonInteractionStatus = 'hover' | 'active' | 'focus-visible'

// 这种写法是为了让 props 声明更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'> {}
export interface ButtonProps extends ButtonProfileProps {}
export interface ButtonProps extends StatusProps<ButtonBusinessStatus> {}

export function Button(props: ButtonProps) {
  // UIKit 都适用的标识，标识能够标识出它是一个怎样的存在的组件
  const profile = createUIKitProfile(props)

  // status 只是汇合和表达状态，不负责判断状态为什么成立。
  const status = createStatusManager<ButtonBusinessStatus>(props.status)

  const isLoading = status.hasStatus('loading')
  const isDisabled = status.hasStatus('disabled')
  const isIdle = derive([isLoading, isDisabled], (loading, disabled) => !loading && !disabled)

  status.setStatus('idle', isIdle)

  const behaviorPlugin = createPivPlugin<'button'>(() => ({
    htmlProps: {
      disabled: isDisabled,
      'aria-busy': isLoading,
    },
  }))

  return (
    <Piv
      as="button"
      shadowProps={props}
      class="Button"
      plugins={[profile.plugin, status.plugin, behaviorPlugin]}
    >
      {props.children}
    </Piv>
  )
}
