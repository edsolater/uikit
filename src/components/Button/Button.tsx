/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { createRenderEffect } from 'solid-js'
import { addDefaultProps } from '../../component-utils/defaultProps'
import { useStatus, type StatusProps } from '../../component-utils/status'
import { useVariant, type VariantProps } from '../../component-utils/variant'
import { type MayState } from '../../hooks'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'
import { createButtonValidity, type ButtonValidIf } from './hooks/createButtonValidity'

export interface ButtonProps extends PivProps<'button'> {
  /** 风格变种，区别在表达信息的 维度/层次 不同 */
  variant?: VariantProps<'solid' | 'outline' | 'ghost'>

  status?: StatusProps<never> // 固定套路， 但暂时没有可指定的状态， 所以先never占位

  /**
   * 快捷禁用入口；true 时按钮不可用。
   */
  disabled?: MayState<boolean>

  /**
   * 显式可用入口；传入时必须为 true 才允许按钮可用。
   */
  enabled?: MayState<boolean>

  /**
   * 更强的验证入口；支持简单 boolean，也支持 `{ should }` 验证对象。
   * 所有条件都通过时按钮才可用，不支持失败后改写 Button props。
   */
  validIf?: ButtonValidIf
}

export function Button(props: ButtonProps) {
  // Solid 组件只初始化一次，props 读取必须保留响应式访问路径。
  const mergedProps = addDefaultProps(props, { variant: 'solid' })
  const variable = useVariant(mergedProps.variant)
  const status = useStatus<'invalid'>(mergedProps.status) //！它应该由信息自发产生，而不是外部指定， 会冲突的
  const validity = createButtonValidity({
    disabled: mergedProps.disabled,
    enabled: mergedProps.enabled,
    validIf: mergedProps.validIf,
  })
  createRenderEffect(() => {
    status.set('invalid', validity.isDisabled())
  })
  return (
    <Piv
      as="button"
      shadowProps={mergedProps}
      class={['Button', variable.class, status.class]}
      htmlProps={{ type: 'button', disabled: validity.isDisabled }}
    >
      {mergedProps.children}
    </Piv>
  )
}
/*  */
