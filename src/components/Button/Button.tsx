/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { useStatus, type StatusProps } from '../../component-utils/status'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { type VariantProps, useVariant } from '../../component-utils/variant'
import { addDefaultProps } from '../../component-utils/defaultProps'

export interface ButtonProps extends PivProps<'button'> {
  variant?: VariantProps<'solid' | 'outline' | 'ghost'>
  status?: StatusProps<'disabled'>
}

export function Button(inputProps: ButtonProps) {
  // Solid 组件只初始化一次，props 读取必须保留响应式访问路径。
  const props = addDefaultProps(inputProps, { variant: 'solid' })
  const variable = useVariant(props.variant)
  const status = useStatus(props.status)
  return (
    <Piv
      as="button"
      shadowProps={props}
      class={['Button', variable.class]}
      htmlProps={{ type: 'button', disabled: status.has('disabled') }}
    >
      {props.children}
    </Piv>
  )
}
