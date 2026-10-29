/**
 * Text 承载独立的纯文字内容。
 *
 * 保留文字的行内、块级或段落排版与来源更新，开启组件定位框时只隐藏文字显示。
 *
 * 真实边界与标注交给统一Wrapper，不复制查看状态或修改原文字。
 */
import { val, type Source } from '@/foundation'
import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import './Text.style'

/** 纯文字来源持续交给Piv消费；block与p只允许提供其中一项。 */
export type TextProps = Omit<
  PivProps<'span' | 'div' | 'p'>,
  'as' | 'children'
> &
  ComponentDescriptionProps & {
    children?: Source<string | number | undefined>
  } & ({ block?: boolean; p?: never } | { p?: boolean; block?: never })

/**
 * 显示纯文字，缺省使用span，block使用div，p使用段落。
 * 定位框开启只改变可见性，关闭后显示来源的最新文字。
 */
export function Text(props: TextProps) {
  return (
    <ComponentMarker
      componentName="Text"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
      defaultDescriptionDisplay={Boolean(val(props.description))}
      descriptionOnly
    >
      <Piv<'span' | 'div' | 'p'>
        as={props.p ? 'p' : props.block ? 'div' : 'span'}
        shadowProps={props}
        class="Text"
      >
        {props.children}
      </Piv>
    </ComponentMarker>
  )
}
