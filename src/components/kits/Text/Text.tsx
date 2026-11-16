/**
 * Text 承载独立的纯文字内容。
 *
 * 保留文字的行内、块级或段落排版与来源更新，开启组件定位框时只隐藏文字显示。
 *
 * 共同接线交给 kit，不复制查看状态或修改原文字。
 */
import { Piv } from '../../Piv/Piv'
import { val } from '@/foundation'
import { kit, type KitComponent } from '../../tools/kit'

import {
  componentName,
  textPropDefinition,
  type TextProps,
  type TextController,
} from './Text.prop'
import './Text.style'

/**
 * 显示纯文字，缺省使用span，block使用div，p使用段落，emphasis使用strong。
 * 定位框开启只改变可见性，关闭后显示来源的最新文字。
 */
export const Text: KitComponent<{
  props: TextProps
  controller: TextController
}> = kit(
  {
    name: componentName,
    propDefinition: textPropDefinition,
    marker: (props) => ({
      descriptionOnly: true,
      get defaultDescriptionDisplay() {
        return Boolean(val(props.description))
      },
    }),
  },
  (props, { name }) => (
    <Piv<'span' | 'div' | 'p' | 'strong'>
      as={
        props.emphasis ? 'strong' : props.p ? 'p' : props.block ? 'div' : 'span'
      }
      shadowProps={props}
      class={name}
      htmlProps={{ 'data-tone': props.tone, 'data-small': props.small }}
    >
      {props.children}
    </Piv>
  ),
)
