/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度、状态表达和基础样式入口，不负责主题系统、表单编排、状态判断、状态来源组装或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createStatusRecord, type StatusInput } from '../../component-utils/status'
import type { ReadableState, Source } from '../../hooks'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createUIKitProfile, type ProfileProps } from './createButtonProfile'

interface ButtonProfileProps extends ProfileProps {
  /**
   * 动作发声力度。
   *
   * 默认是 normal。
   */
  tone?: 'bare' | 'subtle' | 'normal' | 'solid' // 不用 Source<>，因为 tone 不会随状态变化而变化，直接用 string 就可以了。

  /**
   * 动作性质。（改变CSS 颜色）
   *
   * 默认是 neutral。
   */
  intent?: Source<'neutral' | 'accent' | 'danger' | undefined>

  /**
   * 交互尺度。
   *
   * 默认是 normal。
   */
  spacing?: Source<'compact' | 'normal' | 'loose' | undefined>

  /**
   * 自身的表述， 类似于 JS 对象字面量里的key
   */
  name?: Source<string | undefined>

  /**
   * 状态输入，代表当前的信息的状态，而不是组件自身的状态；它会被自动注入到状态管理器中
   */
  status?: StatusInput<ButtonBusinessStatus>
}
type ButtonBusinessStatus = 'loading' | 'disabled'

type ButtonInteractionStatus = 'hover' | 'active' | 'focus-visible' // 交互状态，由 CSS 伪类驱动，区分其与业务。

// 这种写法是为了让 props 声明更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'>, ButtonProfileProps {}

export function Button(props: ButtonProps) {
  // UIKit 都适用的标识，标识能够标识出它是一个怎样的存在的组件
  const [uikitProfileManager, uikitProfilePlugin] = createUIKitProfile(props)

  // 用于管理Button的组件的内部交互状态
  const interactionStatus = createStatusRecord<ButtonInteractionStatus>()

  // TODO：对于Button特有的状态，需要直接写在Button组件内部
  return (
    <Piv as="button" shadowProps={props} class="Button" plugins={uikitProfilePlugin}>
      {props.children}
    </Piv>
  )
}
