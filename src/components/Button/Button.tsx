/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度、状态表达和基础样式入口，不负责主题系统、表单编排、状态判断、状态来源组装或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createStatusRecord, type StatusInput } from '../../component-utils/status'
import { type Source } from '../../hooks'
import { createPivPlugin } from '../BasicPiv'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createUIKitProfile, type ProfileProps } from './createButtonProfile'

interface ButtonProfileProps extends ProfileProps {
  /**
   * 组件的语气
   *
   * 默认是 normal。
   *
   * 不用 Source<>，因为 tone 不会随状态变化而变化，直接用 string 就可以了。
   *
   * - plain：最轻的语气，通常用于次要或辅助动作，或者当按钮需要与背景融为一体时。无边界， 无状态显示
   * - soft：较轻的语气，通常用于次要动作。无边界，无状态显示
   * - normal：默认值，标准语气。有边界，但用并不突兀， 可有当前状态显示。匹配 intent:accent
   * - solid：最强的语气，通常用于主要动作。 更强的操作，需要“打眼”。匹配 intent:accent；非常匹配 intent:danger
   */
  tone?:
    | 'plain' // 最轻的语气
    | 'soft' // 较轻的语气
    | 'normal' // 默认值，标准语气
    | 'solid' // 最强的语气

  /**
   * 动作性质。（会改变CSS 颜色）
   *
   * 默认是 neutral。
   */
  intent?: Source<'neutral' | 'accent' | 'danger' | undefined>

  /**
   * 交互尺度。（按钮给人的可交互区域的感觉）
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
  status?: StatusInput<'loading' | 'disabled'>
}

// 这种写法是为了让 props 声明更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'>, ButtonProfileProps {}

export function Button(props: ButtonProps) {
  // UIKit 都适用的标识，标识能够标识出它是一个怎样的存在的组件
  const [uikitProfileManager, uikitProfilePlugin] = createUIKitProfile(props)

  // TODO：对于Button特有的状态，需要直接写在Button组件内部
  return (
    <Piv
      as="button"
      shadowProps={props}
      class="Button"
      plugins={[uikitProfilePlugin, clickablePlugin({ componentName: 'Button' }), focusablePlugin()]}
      htmlProps={{ type: 'button' }}
    >
      {props.children}
    </Piv>
  )
}

/** 基于 {@link focusablePlugin} */
export function clickablePlugin(options?: { componentName?: string }) {
  // 用于管理Button的组件的内部交互状态
  const [interactionStatus, interactionStatusActions] = createStatusRecord<'hover' | 'active'>()
  const interactionStatusFocus = focusablePlugin(options)
  const plugin = createPivPlugin(() => ({
    class: 'clickable',
    plugins: [interactionStatusFocus.plugin],
    on: {
      pointerover: () => interactionStatusActions.setStatus('hover', true),
      pointerdown: () => interactionStatusActions.setStatus('active', true),
      pointerleave: () => interactionStatusActions.setStatus('hover', false),
      pointerup: () => interactionStatusActions.setStatus('active', false),
      keyup: ({ event, element }) => {
        if (options?.componentName === 'Button') return undefined // 原生用内置button的本来就有点支持了，我们就没有必要多此一举了
        if (event.key === 'Enter' || event.key === ' ') {
          element.click() // 让键盘事件也能触发点击行为，提升键盘操作的体验
        }
      },
    },
  }))
  return { details: interactionStatus, plugin }
}

export function focusablePlugin(options?: { componentName?: string }) {
  // 用于管理Button的组件的内部交互状态
  const [interactionStatus, interactionStatusActions] = createStatusRecord<'focus'>()
  const plugin = createPivPlugin(() => ({
    class: 'focusable',
    htmlProps: {
      tabIndex: 0,
    },
    on: {
      focusin: () => interactionStatusActions.setStatus('focus', true),
      focusout: () => interactionStatusActions.setStatus('focus', false),
    },
  }))
  return { details: interactionStatus, plugin }
}
