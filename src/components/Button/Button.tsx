/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度、状态表达和基础样式入口，不负责主题系统、表单编排、状态判断、状态来源组装或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import {
  createStatusRecordManager,
  type StatusInput,
  type StatusProps,
  type StatusRecordManager,
} from '../../component-utils/status'
import { derive } from '../../hooks/createState/compose'
import type { PivPlugin } from '../BasicPiv'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import { createPivPlugin } from '../BasicPiv/plugin/helpers'
import './button.css'
import { createUIKitProfile, type ButtonProfileProps } from './createButtonProfile'

// 这种写法是为了让 props 声明更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'> {}
export interface ButtonProps extends ButtonProfileProps {}
export interface ButtonProps extends StatusProps<ButtonBusinessStatus> {}

export function Button(props: ButtonProps) {
  // UIKit 都适用的标识，标识能够标识出它是一个怎样的存在的组件
  const [profile, profilePlugin] = createUIKitProfile(props)
  // 状态驱动
  const [status, statusPlugin] = creatButtonStatusManager(props.status)

  return (
    <Piv as="button" shadowProps={props} class="Button" plugins={[profilePlugin, statusPlugin]}>
      {props.children}
    </Piv>
  )
}

export type ButtonBusinessStatus = 'idle' | 'loading' | 'disabled'
// 交互状态
// 由 CSS 伪类驱动，区分其与业务。
export type ButtonInteractionStatus = 'hover' | 'active' | 'focus-visible'
export type ButtonStatus = ButtonBusinessStatus | ButtonInteractionStatus

// 每个 <Button> 自身的states管理器
function creatButtonStatusManager(
  initialStatus: StatusInput<ButtonBusinessStatus>,
): [StatusRecordManager<ButtonBusinessStatus>, PivPlugin<'button'>] {
  const [recordManager, recordManagerPlugin] = createStatusRecordManager<ButtonBusinessStatus>(initialStatus)
  const isLoading = recordManager.hasStatus('loading')
  const isDisabled = recordManager.hasStatus('disabled')

  // 🤔 为什么要映射，基元的状态就是可组合！我在想反馈代表当前组件的状态不需要映射，但是判断的时候需要映射，判断这个所有需要满足的基元状态有没有？
  // 所以 Idle 更适合作为一个 getter source
  const isIdle = derive([isLoading, isDisabled], (loading, disabled) => !loading && !disabled)
  recordManager.setStatus('idle', isIdle)

  const behaviorPlugin = createPivPlugin<'button'>(() => ({
    plugins: recordManagerPlugin,
    htmlProps: {
      disabled: isDisabled,
      'aria-busy': isLoading,
    },
  }))

  return [recordManager, behaviorPlugin]
}
