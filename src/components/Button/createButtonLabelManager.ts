/**
 * 这个文件定义 Button 内容摘要管理能力。
 * 它负责把 label 语义转换成可访问名称相关的原生属性。
 */
import { createPivPlugin } from '../BasicPiv/plugin/helpers'
import { type Source } from '../../hooks'

export type ButtonLabelProps = {
  /**
   * 内容摘要。
   *
   * 不替代 children，主要用于图标按钮和可访问名称。
   */
  label?: Source<string | undefined>
}

export function createDescriptionManager(props: ButtonLabelProps) {
  const labelPlugin = createPivPlugin<'button'>(() => ({
    htmlProps: {
      'aria-label': props.label,
    },
  }))

  return {
    details: {
      label: props.label,
    },
    plugin: labelPlugin,
  }
}
