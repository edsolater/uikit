/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { mergeProps, splitProps, type JSX } from 'solid-js'
import './button.css'
import { Piv } from '../base/Piv'

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  class?: string
  type?: JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
  variant?: 'solid' | 'ghost'
  children?: JSX.Element
}

export function Button(inputProps: ButtonProps) {
  // Solid 组件只初始化一次，props 读取必须保留响应式访问路径。
  const props = mergeProps({ variant: 'solid' as const, type: 'button' as const }, inputProps)
  const [local, buttonHTMLProps] = splitProps(props, ['variant', 'class', 'type', 'style', 'children'])
  const classes = () => ['rk-button', `rk-button--${local.variant}`, local.class].filter(Boolean).join(' ')

  return (
    <Piv
      as="button"
      class={classes()}
      style={local.style}
      htmlProps={{
        type: local.type,
        ...buttonHTMLProps,
      }}
    >
      {local.children}
    </Piv>
  )
}
