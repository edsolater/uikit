/**
 * Markdown 是可按语法类型定制的 Markdown 阅读组件。
 *
 * 接收原文并将解析结果交给默认或调用方提供的渲染函数。
 *
 * 解析与显示保持分工，组件不强制独立正文或卡片语义。
 */
import { stateView, val } from '@/foundation'
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  markdownPropDefinition,
  type MarkdownProps,
  type MarkdownController,
} from './Markdown.prop'
import { renderMarkdown } from './Markdown.renderer'
import { parseMarkdown } from './Markdown.parser'
import './Markdown.style'

/**
 * 渲染 children 中的 Markdown，renderers 的 content 接收已渲染子内容。
 * 原文与配置均持续更新；原生 HTML 默认显示为文本。
 *
 * @example
 * <Markdown renderers={{ h2: ({ content }) => <Heading level={2}>{content}</Heading> }}>
 *   {'## 认识 **UIKit**'}
 * </Markdown>
 */
export const Markdown: KitComponent<{
  props: MarkdownProps
  controller: MarkdownController
}> = kit(
  {
    name: componentName,
    componentDescription: '阅读 Markdown 内容',
    propDefinition: markdownPropDefinition,
  },
  (props, { name }) => {
    const content = stateView(() => parseMarkdown(val(props.children)))
    return (
      <Piv shadowProps={props} class={name}>
        {renderMarkdown(val(content), val(props.renderers))}
      </Piv>
    )
  },
)
