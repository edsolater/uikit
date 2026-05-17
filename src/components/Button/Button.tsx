/**
 * 这个文件定义基础按钮组件 Button。
 * 它负责按钮默认 type、variant class 和基础样式入口，不负责主题系统、表单编排或路由行为。
 * 底层 DOM 能力统一交给 Piv，按钮文件只表达按钮这个组件主体。
 */
import { mergeProps } from 'solid-js'
import { derive, type MayState } from '../../hooks'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './button.css'

export interface ButtonProps extends PivProps<'button'> {
  variant?: MayState<'solid' | 'outline' | 'ghost'>
  disabled?: MayState<boolean>
}

export function Button(inputProps: ButtonProps) {
  // Solid 组件只初始化一次，props 读取必须保留响应式访问路径。
  const props = mergeProps({ variant: 'solid' }, inputProps)
  return (
    <Piv
      as="button"
      shadowProps={props}
      class={['Button', derive(props.variant, (v) => `variant:${v}`)]}
      htmlProps={{ type: 'button', disabled: props.disabled }}
      on={{
        click: (ev) => {
          console.log('Button clicked', ev)
        }
      }}
    >
      {props.children}
    </Piv>
  )
}
