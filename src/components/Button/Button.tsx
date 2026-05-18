/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createRenderEffect } from 'solid-js'
import { addDefaultProps } from '../../component-utils/defaultProps'
import { useStatus, type StatusProps } from '../../component-utils/status'
import { useVariant, type VariantProps } from '../../component-utils/variant'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createValiditor, type ValidityOptions } from './hooks/createButtonValidity'

// 这种写法是为了让文本更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'> {}
export interface ButtonProps extends ValidityOptions {}
export interface ButtonProps extends VariantProps<'solid' | 'outline' | 'ghost'> {}
export interface ButtonProps extends StatusProps<never> {}

export function Button(rawProps: ButtonProps) {
  const props = addDefaultProps(rawProps, { variant: 'solid' })

  const variable = useVariant(props.variant)
  const status = useStatus<'invalid'>(props.status) //！它应该由信息自发产生，而不是外部指定， 会冲突的

  const validity = createValiditor({
    disabled: props.disabled,
    enabled: props.enabled,
    validIf: props.validIf,
  })

  createRenderEffect(() => {
    status.set('invalid', validity.isDisabled())
  })
  return (
    <Piv
      as="button"
      shadowProps={props}
      class={['Button', variable.class, status.class]}
      htmlProps={{ type: 'button', disabled: validity.isDisabled }}
    >
      {props.children}
    </Piv>
  )
}
/*  */
