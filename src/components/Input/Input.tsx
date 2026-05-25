/**
 * 这个文件定义基础输入组件 Input。
 * 它负责 input 本体、默认 type、variant class 和 invalid 状态入口。
 * 它不负责 label、hint、error 文案编排，也不负责表单提交协议。
 */
import { createStatusRecord, type StatusProps } from '../../component-utils/status'
import { createVariantManager, type VariantProps } from '../../component-utils/variant'
import { Piv, type PivProps } from '../BasicPiv/Piv'
import './input.css'
import { createValiditor, type ValidityOptions } from './createInputValidity'

export interface InputProps extends PivProps<'input'> {}
export interface InputProps extends ValidityOptions {}
export interface InputProps extends VariantProps<'outline' | 'ghost'> {}
export interface InputProps extends StatusProps<never> {}

export function Input(props: InputProps) {
  const [status, statusActions] = createStatusRecord<'invalid'>()
  const [variant, variantPlugin] = createVariantManager(props, { defaultVariant: 'outline' })
  const validity = createValiditor(props)

  const isInvalid = validity.isValid.map((v) => !v)

  statusActions.setStatus('invalid', isInvalid)

  return <Piv as="input" shadowProps={props} class="Input" plugins={[variantPlugin]} htmlProps={{ type: 'text' }} />
}
