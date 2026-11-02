/**
 * Text 承载独立的纯文字内容。
 *
 * 保留文字的行内、块级或段落排版与来源更新，开启组件定位框时只隐藏文字显示。
 *
 * 共同接线交给 kit，不复制查看状态或修改原文字。
 */
import { val, type Source } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import type { RefReceiver } from '@/hooks/createRef'
import { kit, type KitController } from '@/components/tools/kit'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import { pivDefaultSources } from '@/components/Piv/Piv.prop'
import { textPropsDefinition } from './Text.prop'
import './Text.style'

/** 纯文字来源持续交给Piv消费；block与p只允许提供其中一项。 */
export type TextProps = Omit<
  PivProps<'span' | 'div' | 'p' | 'strong'>,
  'as' | 'children'
> &
  ComponentDescriptionProps & {
    children?: Source<string | number | undefined>
    /** 特殊运行期需求下接收本实例 Controller，初始界面仍由 Props 表达。 */
    ref?: RefReceiver<TextController>
    /** 文字自身的语气，不改变其内容或字段状态。 */
    tone?: Source<'normal' | 'muted' | 'warning' | 'result' | undefined>
  } & (
    | { block?: boolean; p?: never; emphasis?: never }
    | { p?: boolean; block?: never; emphasis?: never }
    | { emphasis?: boolean; p?: never; block?: never }
  )

/** 文字与继承字段的指令式入口；标签选择只在组件创建时生效。 */
export type TextController = KitController<
  TextProps,
  typeof textPropsDefinition
>

/**
 * 显示纯文字，缺省使用span，block使用div，p使用段落，emphasis使用strong。
 * 定位框开启只改变可见性，关闭后显示来源的最新文字。
 */
export const Text = kit(
  {
    name: 'Text',
    availableProps: textPropsDefinition,
    directorOptions: () => ({ defaultSources: pivDefaultSources }),
    marker: (props) => ({
      descriptionOnly: true,
      get defaultDescriptionDisplay() {
        return Boolean(val(props.description))
      },
    }),
  },
  (props: TextProps) => (
    <Piv<'span' | 'div' | 'p' | 'strong'>
      as={
        props.emphasis ? 'strong' : props.p ? 'p' : props.block ? 'div' : 'span'
      }
      shadowProps={props}
      class="Text"
      htmlProps={{ 'data-tone': props.tone }}
    >
      {props.children}
    </Piv>
  ),
)
