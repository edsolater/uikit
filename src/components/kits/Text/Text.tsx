/**
 * Text 承载独立的纯文字内容。
 *
 * 保留文字的原生语义、排版与来源更新，开启组件定位框时只隐藏文字显示。
 *
 * 真实边界与标注交给统一Wrapper，不复制查看状态或修改原文字。
 */
import type { Source } from '@/foundation'
import { ComponentWrapper, type ComponentDescriptionProps } from '@/components/ComponentWrapper/ComponentWrapper'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import './Text.css'

/** 纯文字当前支持的原生承载语义。 */
export type TextTag = 'span' | 'h2' | 'p' | 'div'

/** 文字来源持续交给Piv消费，不接受交互组件子树。 */
export type TextProps =
  Omit<PivProps<TextTag>, 'children'> & ComponentDescriptionProps & {
    children?: Source<string | number | undefined>
  }

/**
 * 按所选原生标签显示纯文字，省略as时使用span。
 * 定位框开启只改变可见性，关闭后显示来源的最新文字。
 */
export function Text(props: TextProps) {
  return <ComponentWrapper componentName="Text" description={props.description} descriptionOnly>
    <Piv<TextTag> as={props.as ?? 'span'} shadowProps={props} class="Text">{props.children}</Piv>
  </ComponentWrapper>
}
