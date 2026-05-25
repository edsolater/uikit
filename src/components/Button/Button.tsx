/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度、状态表达和基础样式入口，不负责主题系统、表单编排、状态判断、状态来源组装或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createStatusRecord, type StatusInput } from '../../component-utils/status'
import type { Source } from '../../hooks'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createUIKitProfile } from './createButtonProfile'

type ButtonProfileProps = {
  /**
   * 动作发声力度。
   *
   * 默认是 normal。
   */
  tone?: Source<'bare' | 'subtle' | 'normal' | 'solid'>

  /**
   * 动作性质。
   *
   * 默认是 neutral。
   */
  intent?: Source<'neutral' | 'accent' | 'danger'>

  /**
   * 交互尺度。
   *
   * 默认是 normal。
   */
  scale?: Source<'compact' | 'normal' | 'large'>

  /**
   * 原生 button type。
   *
   * auto 表示交给原生 button 按所在环境选择默认行为。
   */
  domType?: Source<'auto' | 'button' | 'submit' | 'reset'>

  /**
   * 所承载信息的简介，代表了这个组件所承载的信息的架构在思维导图中的描述
   */
  label?: Source<string | undefined>

  /**
   * 信息的业务状态输入；它会被自动注入到状态管理器中
   */
  status?: StatusInput<ButtonBusinessStatus>
}

// 这种写法是为了让 props 声明更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'> {}
export interface ButtonProps extends ButtonProfileProps {}
type ButtonBusinessStatus = 'loading' | 'disabled'
type ButtonInteractionStatus = 'hover' | 'active' | 'focus-visible' // 交互状态，由 CSS 伪类驱动，区分其与业务。

export function Button(props: ButtonProps) {
  // UIKit 都适用的标识，标识能够标识出它是一个怎样的存在的组件
  const [uikitProfileManager, profilePlugin] = createUIKitProfile(props)

  // 用于管理Button的组件的内部交互状态
  const interactionStatus = createStatusRecord<ButtonInteractionStatus>()

  return (
    <Piv
      as="button"
      shadowProps={props}
      class="Button"
      plugins={profilePlugin}
    >
      {props.children}
    </Piv>
  )
}
