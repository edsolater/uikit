/**
 * 这个文件定义 Button 固有画像能力。
 * 它负责管理 tone、intent、scale、type 这些不随运行状态改变的 Button 身份信息。
 * 当前实现会产出 class 和原生 type，但这些只是 profile 的底层消费方式。
 */
import { createPivPlugin } from '../BasicPiv/plugin/helpers'
import { state, type Source } from '../../hooks'

export type ButtonTone = 'bare' | 'subtle' | 'normal' | 'solid'
export type ButtonIntent = 'neutral' | 'accent' | 'danger'
export type ButtonScale = 'compact' | 'normal' | 'large'
export type ButtonType = 'auto' | 'button' | 'submit' | 'reset'

export type ButtonProfileProps = {
  /**
   * 动作发声力度。
   *
   * 默认是 normal。
   */
  tone?: Source<ButtonTone>

  /**
   * 动作性质。
   *
   * 默认是 neutral。
   */
  intent?: Source<ButtonIntent>

  /**
   * 交互尺度。
   *
   * 默认是 normal。
   */
  scale?: Source<ButtonScale>

  /**
   * 原生 button type。
   *
   * auto 表示交给原生 button 按所在环境选择默认行为。
   */
  type?: Source<ButtonType>
}

export function createUIKitProfile(props: ButtonProfileProps) {
  const tone = state(props.tone).map((tone) => tone ?? 'normal')
  const intent = state(props.intent).map((intent) => intent ?? 'neutral')
  const scale = state(props.scale).map((scale) => scale ?? 'normal')
  const nativeType = state(props.type).map((type) => {
    return type === undefined || type === 'auto' ? null : type
  })

  const profilePlugin = createPivPlugin<'button'>(() => ({
    class: [
      tone.map((tone) => `tone:${tone}`),
      intent.map((intent) => `intent:${intent}`),
      scale.map((scale) => `scale:${scale}`),
    ],
    htmlProps: {
      'attr:type': nativeType,
    },
  }))

  return {
    details: {
      tone,
      intent,
      scale,
      nativeType,
    },
    plugin: profilePlugin,
  }
}
