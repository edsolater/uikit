/**
 * 这个文件定义基础输入组件 Input。
 * Input 承载一个单行可编辑值，适合普通表单字段、筛选条件和设置项。
 * label、说明文案、错误文案和字段布局属于更上层的 Field 组合，不塞进 Input 本体。
 * Input 当前只有默认形态；视觉强弱不通过 variant、tone、ghost、bare 或 solid 表达。
 *
 * 组件选择规则见 [Input 设计规格](./Input.spec.md)。
 * 稳定语义见 [Input 基础组件 Guide](../../../../docs/guide/Input基础组件.md)。
 */
import { Piv, type PivProps } from '../../Piv/Piv'
import { createPivPlugin } from '../../Piv/plugin/helpers'
import './Input.css'
import { createValiditor, type ValidityOptions } from './createInputValidity'

export interface InputProps extends PivProps<'input'>, ValidityOptions {}

export function Input(props: InputProps) {
  const validity = createValiditor(props)
  const isInvalid = validity.isValid.map((v) => !v)
  const inputStatusPlugin = createPivPlugin(() => ({
    class: { invalid: isInvalid },
    htmlProps: { 'aria-invalid': isInvalid },
  }))

  return <Piv as="input" shadowProps={props} class="Input" plugins={[inputStatusPlugin]} htmlProps={{ type: 'text' }} />
}
