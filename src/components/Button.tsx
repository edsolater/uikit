// 这个文件只定义基础按钮主体，不负责主题系统、表单编排或路由行为。
import { mergeProps, splitProps, type JSX } from 'solid-js'
import './button.css'

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  class?: string
  type?: JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
  variant?: 'solid' | 'ghost'
  children?: JSX.Element
}

export function Button(inputProps: ButtonProps) {
  // Solid 组件只初始化一次，props 读取必须保留响应式访问路径。
  const props = mergeProps({ variant: 'solid' as const, type: 'button' as const }, inputProps)
  const [local, buttonProps] = splitProps(props, ['variant', 'class', 'type'])
  const classes = () =>
    ['rk-button', `rk-button--${local.variant}`, local.class,]
      .filter(Boolean)
      .join(' ')

  return <button class={classes()} type={local.type} {...buttonProps} />
}
