/**
 * 这个文件定义基础输入组件 Input。
 * Input 承载一个单行可编辑值，适合普通表单字段、筛选条件和设置项。
 * label、说明文案、错误文案和字段布局属于更上层的 Field 组合，不塞进 Input 本体。
 * Input 当前只有默认形态；视觉强弱不通过 variant、ghost、bare 或 solid 表达。
 *
 * 组件选择规则见 [Input 设计规格](./Input.spec.md)。
 * 稳定语义见 [Input 基础组件 Guide](../../../../docs/guide/Input基础组件.md)。
 */
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { inputPropsDefinition } from './Input.prop'
import { pivDefaultSources } from '@/components/Piv/Piv.prop'
import { Piv, type PivProps } from '../../Piv/Piv'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import {
  createStatusPropsParser,
  type StatusController,
} from '../utils/parseStatusProps'
import './Input.style'
import { type Source, val } from '@/foundation'
import {
  createInputValidity,
  type InputValidityProps,
} from './createInputValidity'

export interface InputProps
  extends PivProps<'input'>, InputValidityProps, ComponentDescriptionProps {
  ref?: RefReceiver<InputController>
  /** 原生输入类型；省略时为单行文字。 */
  type?: Source<'text' | 'color' | undefined>
}

const parseInputStatusProps = createStatusPropsParser({
  candidates: ['invalid'],
  effect: ({ invalid }) => ({
    htmlProps: {
      'aria-invalid': invalid,
    },
  }),
})

/** 顶层公开输入有效性状态，props 提供通用输入干预；ref 只从上游交付。 */
export type InputController = KitController<
  InputProps,
  typeof inputPropsDefinition,
  StatusController<'invalid'>
>

/**
 * 编辑单行内容，保留原有效性计算与状态映射。
 */
export const Input = kit<InputProps, typeof inputPropsDefinition>(
  {
    name: 'Input',
    description: '编辑单行内容',
    availableProps: inputPropsDefinition,
    directorOptions: () => ({ defaultSources: pivDefaultSources }),
  },
  (props: InputProps, context) => {
    const validity = createInputValidity(props)
    const isInvalid = validity.isValid.map((isValid) => !isValid)
    const { effect: statusEffectProps, controller } = parseInputStatusProps({
      invalid: isInvalid,
    })
    context.exposeController(controller)

    return (
      <Piv
        as="input"
        shadowProps={[props, ...statusEffectProps]}
        class="Input"
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
