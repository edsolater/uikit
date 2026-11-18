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
import { createFormFieldId, useFormFieldId } from '../FormField/FormField'
import { val } from '@/foundation'
import { derive } from '@/hooks'
import { createInputValidity } from './validity'

/**
 * 把 invalid Source 接到 aria-invalid，不改写用户输入值。
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
    // 取得表单关联标识，并把校验结果接为 invalid 来源。
    const id = createFormFieldId(props, useFormFieldId())
    const validity = createInputValidity(props)
    const isInvalid = derive(validity.isValid, (isValid) => !isValid)
    const { effectResult: statusEffectResultProps, controller } =
      parseInputStatusProps({
        invalid: isInvalid,
      })
    exposeController(controller)

    // 剩余声明与状态产物交给输入节点，原生编辑选项在这里确定。
    return (
      <Piv
        as="input"
        shadowProps={[props, ...statusEffectResultProps]}
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
