/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮动作语义、声量 class、交互尺度、状态表达和基础样式入口，不负责主题系统、表单编排、状态判断、状态来源组装或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { clickable } from '../../component-plugins'
import { type StatusInput } from '../../component-utils/status'
import { type Source } from '../../hooks'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createKitProfile, type ProfileProps } from './createKitProfile'

interface ButtonProfileProps extends ProfileProps {
  /**
   * 动作声量。
   *
   * 默认是 normal，调用方不需要显式传入。
   *
   * 不用 Source<>，因为 tone 不会随状态变化而变化，直接用 string 就可以了。
   *
   * - bare：退场声量，无容器，适合辅助动作。
   * - undefined：默认声量，有稳定容器感。
   * - solid：强调声量，适合主操作或高风险确认。
   */
  tone?: 'bare' | 'solid'

  /**
   * 动作性质。（会改变CSS 颜色）
   */
  intent?: Source<'accent' | 'danger' | undefined>

  /**
   * 交互尺度。（按钮给人的可交互区域的感觉）
   * - small：紧凑，适用于工具栏或空间受限的场景。
   * - large：宽松，适用于需要强调的场景或触控设备。
   * - undefined：默认尺度，适用于大多数场景。
   */
  spacing?: Source<'small' | 'large' | undefined>

  /**
   * 自身的表述， 类似于 JS 对象字面量里的key
   * TODO：这个属性的正好可以用于做界面的数据化时 的 key。
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
  const { plugin: kitProfilePlugin } = createKitProfile(props)

  // TODO：对于Button特有的状态，需要直接写在Button组件内部
  return (
    <Piv
      as="button"
      shadowProps={props}
      class="Button"
      plugins={[kitProfilePlugin, clickable({ componentName: 'Button' })]}
      htmlProps={{ type: 'button' }}
    >
      {props.children}
    </Piv>
  )
}
