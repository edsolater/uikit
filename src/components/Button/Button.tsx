/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createStatusManager, type StatusProps } from '../../component-utils/status'
import { createVariantManager, type VariantProps } from '../../component-utils/variant'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createValiditor, type ValidityOptions } from './createButtonValidity'

// 这种写法是为了让文本更像排比插件，更具可读性。
export interface ButtonProps extends PivProps<'button'> {}
export interface ButtonProps extends ValidityOptions {}
export interface ButtonProps extends VariantProps<'outline' | 'ghost'> {}
export interface ButtonProps extends StatusProps<never> {}

export function Button(props: ButtonProps) {
  const status = createStatusManager<'invalid'>()
  const variant = createVariantManager(props)
  const validity = createValiditor(props)

  const isDisabled = validity.isValid.map((v) => !v)

  status.actions.setStatus('invalid', isDisabled)

  return (
    <Piv
      as="button"
      shadowProps={props}
      class="Button"
      plugins={[variant.plugin, status.plugin]}
      htmlProps={{ type: 'button', disabled: isDisabled }}
    >
      {props.children}
    </Piv>
  )
}
