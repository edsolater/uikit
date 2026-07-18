/**
 * 这个文件定义基础按钮组件 Button。
 * Button 承载当前界面里的一个可执行动作，适合保存、确认、取消、清除、删除这类命令。
 * 会改变位置的交互应使用 Link；业务流程判断、表单编排和状态来源不塞进 Button 本体。
 * Button 只把动作内容、动作声量、动作性质、按钮尺寸和外部状态翻译成原生 button。
 *
 * 组件选择规则见 [Button 设计规格](./spec.md)。
 * 长期业务语义见 [Button 基础组件业务说明](../../../docs/features/Button基础组件_业务说明.md)。
 */
import { clickable } from '../../component-plugins'
import { type StatusInput } from '../../component-utils/status'
import { type Source } from '../../hooks'
import { Piv, type PivProps } from '../Piv'
import type { EventListenerInput } from '../Piv/on/handleOn'
import './button.css'
import { createKitProfile, type ProfileProps } from './createKitProfile'

interface ButtonProfileProps extends ProfileProps {
  /** 用户执行这个按钮动作时触发。Button 在内部把它翻译成 Piv 的 click 事件声明。 */
  onClick?: EventListenerInput<'click'>

  /**
   * 动作声量，用来判断这个动作应该以多大权重进入界面。
   *
   * 默认是 normal，调用方不需要显式传入。
   *
   * 不用 Source<>，因为 tone 不会随状态变化而变化，直接用 string 就可以了。
   *
   * - bare：动作存在但退场，适合清除、跳过、更多这类低权重命令。
   * - undefined：默认动作，适合普通确认、关闭、返回这类常规命令。
   * - solid：动作需要优先被看见，适合主操作或高风险确认。
   */
  tone?: 'bare' | 'solid' | undefined

  /**
   * 动作性质，用来表达这个命令是什么类型的事。
   *
   * - undefined：普通动作。
   * - accent：推荐路径动作。
   * - danger：破坏性动作。
   */
  intent?: Source<'accent' | 'danger' | undefined>

  /**
   * 按钮尺寸档位。
   *
   * size 直接表达按钮的物理尺度；选择时同时考虑当前区域的信息密度、操作频率和命中面积。
   *
   * - small：紧凑，适用于工具栏或空间受限的场景。
   * - large：宽松，适用于需要强调的场景或触控设备。
   * - undefined：默认尺度，适用于大多数场景。
   */
  size?: Source<'small' | 'large' | 'xlarge' | undefined>

  /**
   * 动作名。
   *
   * name 描述“这个按钮动作是什么”，用于可访问性、调试和纯图形按钮的动作识别。
   * 这个字段站在界面动作语义上，不兼容原生表单 name 语义。
   * 它不替代 children，也不表示可见文案；普通文本按钮应优先把可见内容写进 children。
   * 当 children 只有图标或其他非文本内容时，用 name 提供 aria-label。
   * 原生 button 的 name attribute 通过 htmlProps.name 传入，不使用这个字段。
   */
  name?: Source<string | undefined>

  /**
   * 外部注入的动作状态。
   *
   * Button 只表达状态，不判断为什么 loading 或 disabled。
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
      on={{ click: props.onClick }}
    >
      {props.children}
    </Piv>
  )
}
