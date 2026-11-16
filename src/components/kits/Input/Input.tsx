/**
 * Input 是承载单行可编辑值的基础控件。
 *
 * 呈现输入值和字段状态，保留默认视觉形态及原生编辑行为。
 *
 * 将字段编辑与上层标题、说明、错误提示和布局分开。
 *
 * 组件选择规则见 [Input 设计规格](./Input.spec.md)。
 * 稳定语义见 [Input 基础组件 Guide](../../../../docs/guide/Input基础组件.md)。
 */
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  inputPropDefinition,
  type InputProps,
  type InputController,
} from './Input.prop'
import { Piv } from '../../Piv/Piv'
import { createStatusPropsParser } from '../utils/parseStatusProps'
import './Input.style'
import { createFormFieldBinding, useFormFieldId } from '../FormField/FormField'
import { val } from '@/foundation'
import { createInputValidity } from './createInputValidity'

/**
 * 将输入有效性映射为节点的无障碍状态，不改写字段值。
 */
const parseInputStatusProps = createStatusPropsParser({
  candidates: ['invalid'],
  effect: ({ invalid }) => ({
    htmlProps: {
      'aria-invalid': invalid,
    },
  }),
})

/**
 * 编辑单行内容并呈现字段有效性，保持输入值与状态来源持续更新。
 */
export const Input: KitComponent<{
  props: InputProps
  controller: InputController
}> = kit(
  {
    name: componentName,
    componentDescription: '编辑单行内容',
    propDefinition: inputPropDefinition,
  },
  (props, { name, exposeController }) => {
    const { id, rootProps } = createFormFieldBinding(props, useFormFieldId())
    const validity = createInputValidity(props)
    const isInvalid = validity.isValid.map((isValid) => !isValid)
    const { effect: statusEffectProps, controller } = parseInputStatusProps({
      invalid: isInvalid,
    })
    exposeController(controller)

    return (
      <Piv
        as="input"
        shadowProps={[rootProps, ...statusEffectProps]}
        class={name}
        id={id}
        htmlProps={{
          type: val(props.type) ?? 'text',
          autocorrect: 'off',
          spellcheck: 'false',
          autocomplete: 'off',
          autocapitalize: 'none',
        }}
      />
    )
  },
)
