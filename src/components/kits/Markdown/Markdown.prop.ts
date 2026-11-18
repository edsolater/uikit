/**
 * Markdown 的原文输入与按语法类型定制的渲染协议。
 *
 * 将递归后的内容和节点信息交给对应渲染函数，保留组件的公共实例控制。
 *
 * 调用方无需了解内部内容树即可替换呈现。
 */
import type { JSX, Source } from '@/foundation'
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份。 */
export const componentName = 'Markdown'

/** 已递归渲染的子内容；不是待解析的 Markdown 原文。 */
export interface MarkdownContent {
  content: JSX.Element
}

/** 各语法类型交付给渲染函数的信息；代码和纯文字的 content 保留字符串。 */
export interface MarkdownRendererInputs {
  h1: MarkdownContent
  h2: MarkdownContent
  h3: MarkdownContent
  h4: MarkdownContent
  h5: MarkdownContent
  h6: MarkdownContent
  paragraph: MarkdownContent
  strong: MarkdownContent
  emphasis: MarkdownContent
  deletion: MarkdownContent
  blockquote: MarkdownContent
  link: MarkdownContent & {
    /** 已解码的目标；相对地址及 HTTP、HTTPS、mailto、tel 以外的协议不交付。 */
    href: string | undefined
    title?: string
  }
  image: {
    /** 图片只接受相对地址及 HTTP、HTTPS；不支持的协议为 undefined。 */
    src: string | undefined
    alt: string
    title?: string
  }
  list: MarkdownContent & { ordered: boolean; start?: number }
  listItem: MarkdownContent & { task: boolean; checked?: boolean }
  checkbox: { checked: boolean }
  table: MarkdownContent
  tableRow: MarkdownContent & { header: boolean }
  tableCell: MarkdownContent & {
    header: boolean
    align: 'left' | 'center' | 'right' | null
  }
  inlineCode: { content: string }
  codeBlock: {
    content: string
    /** 围栏信息的第一个词；不自动执行语法高亮。 */
    language?: string
  }
  text: { content: string }
  /** 原生 HTML 按原文显示，不作为 DOM 执行。 */
  html: { content: string }
  thematicBreak: {}
  break: {}
}

/**
 * 按需覆盖语法类型；省略字段使用默认呈现。
 * 已提供的函数直接决定结果，返回 null、false 或 undefined 均隐藏该内容。
 */
export type MarkdownRenderers = {
  [Key in keyof MarkdownRendererInputs]?: (
    input: MarkdownRendererInputs[Key],
  ) => JSX.Element
}

/** Markdown 原文通过 children 提供，renderers 仅决定解析后的呈现。 */
export type MarkdownProps = Omit<
  KitProps<{ controller: MarkdownController }>,
  'as' | 'children'
> & {
  children: Source<string>
  renderers?: Source<MarkdownRenderers | undefined>
}

const { as: _as, ...markdownCommonPropDefinition } = kitPropDefinition
const markdownOwnPropDefinition = {
  children: 'source',
  renderers: 'source',
} as const

/** 原文与渲染器整体保留来源，解析与呈现处才读取当前值。 */
export type MarkdownPropDefinition = Omit<
  KitPropDefinition<typeof markdownOwnPropDefinition>,
  'as'
>

/** 与公开 Props 对应的完整字段协议。 */
export const markdownPropDefinition: MarkdownPropDefinition = {
  ...markdownCommonPropDefinition,
  ...markdownOwnPropDefinition,
}

/** 控制原文、渲染配置和组件公共输入。 */
export interface MarkdownController extends KitController<{
  props: MarkdownProps
  propDefinition: MarkdownPropDefinition
}> {}
