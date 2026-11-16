/**
 * Markdown 自有的内容树。
 *
 * 保存块结构、行内内容和呈现所需的语义信息。
 *
 * 解析与渲染共享这份内部协议，公开渲染函数不接触语法树。
 */

/** 带子内容的行内与块级节点。 */
type MarkdownContainer = {
  type: 'paragraph' | 'strong' | 'emphasis' | 'deletion' | 'blockquote'
  children: MarkdownNode[]
}

/** 列表项独立保存任务状态；紧凑列表的段落由列表整体决定。 */
export interface MarkdownListItem {
  children: MarkdownNode[]
  task: boolean
  checked?: boolean
}

/** 内部内容节点，只表达当前支持的 Markdown 语法。 */
export type MarkdownNode =
  | MarkdownContainer
  | { type: 'text' | 'html' | 'inlineCode'; content: string }
  | { type: 'codeBlock'; content: string; language?: string }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MarkdownNode[] }
  | { type: 'link'; href: string; title?: string; children: MarkdownNode[] }
  | { type: 'image'; src: string; title?: string; alt: string }
  | {
      type: 'list'
      ordered: boolean
      start?: number
      loose: boolean
      items: MarkdownListItem[]
    }
  | {
      type: 'table'
      align: Array<'left' | 'center' | 'right' | null>
      header: MarkdownNode[][]
      rows: MarkdownNode[][][]
    }
  | { type: 'checkbox'; checked: boolean }
  | { type: 'thematicBreak' | 'break' }

/** 文档内的引用链接目标；标签在解析时统一空白与大小写。 */
export type MarkdownReferences = Map<string, { href: string; title?: string }>
