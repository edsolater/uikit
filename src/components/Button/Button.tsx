/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { mergeProps, splitProps, type JSX } from 'solid-js'
import './button.css'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import type { MayState } from '../../hooks'

export interface ButtonProps extends PivProps<'button'> {
  type?: MayState<JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']>
  variant?: MayState<'solid' | 'outline' | 'ghost'>
}

export function Button(inputProps: ButtonProps) {
  // Solid 组件只初始化一次，props 读取必须保留响应式访问路径。
  const props = mergeProps({ variant: 'solid' as const, type: 'button' as const }, inputProps)
  return (
    <Piv
      as="button"
      shadowProps={props}
      class={['Button', `variant-${props.variant}`, props.class]}
      htmlProps={{
        type: props.type,
      }}
    >
      {props.children}
    </Piv>
  )
}
