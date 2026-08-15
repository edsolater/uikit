/**
 * 这个文件定义基础输入组件 Input。
 * Input 承载一个单行可编辑值，适合普通表单字段、筛选条件和设置项。
 * label、说明文案、错误文案和字段布局属于更上层的 Field 组合，不塞进 Input 本体。
 * Input 当前只有默认形态；视觉强弱不通过 variant、ghost、bare 或 solid 表达。
 *
 * 组件选择规则见 [Input 设计规格](./Input.spec.md)。
 * 稳定语义见 [Input 基础组件 Guide](../../../../docs/guide/Input基础组件.md)。
 */
import { Piv, type PivProps } from '../../Piv/Piv'
import { createStatusPropsParser } from '../utils/parseStatusProps'
import './Input.css'
import { createInputValidity, type InputValidityProps } from './createInputValidity'

export interface InputProps extends PivProps<'input'>, InputValidityProps {}

const parseInputStatusProps = createStatusPropsParser({
  candidates: ['invalid'],
  effect: ({ invalid }) => ({
    htmlProps: {
      'aria-invalid': invalid,
    },
  }),
})

export function Input(props: InputProps) {
  const validity = createInputValidity(props)
  const isInvalid = validity.isValid.map((isValid) => !isValid)
  const { statusShadowProps } = parseInputStatusProps({ invalid: isInvalid })

  return (
    <Piv as="input" shadowProps={[props, statusShadowProps]} class="Input" htmlProps={{ type: 'text' }} />
  )
}
