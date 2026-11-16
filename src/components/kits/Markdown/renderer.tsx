/**
 * Markdown 语法节点的递归呈现。
 *
 * 将解析器节点转换为公开的 content 协议，并为未覆盖的类型提供原生语义。
 *
 * 解析器类型留在内部，默认呈现复用 UIKit 中契约适配的能力。
 */
import type { MarkdownNode } from './syntax-tree'
import type { JSX } from '@/foundation'
import { Piv } from '../../Piv/Piv'
import { Heading } from '../Heading/Heading'
import { Link } from '../Link/Link'
import type { MarkdownRendererInputs, MarkdownRenderers } from './Markdown.prop'

/** 默认呈现只拥有自己生成的节点，不覆盖 Heading、Link 或调用方组件的样式。 */
const defaultRenderers: Required<MarkdownRenderers> = {
  h1: ({ content }) => <Heading level={1}>{content}</Heading>,
  h2: ({ content }) => <Heading level={2}>{content}</Heading>,
  h3: ({ content }) => <Heading level={3}>{content}</Heading>,
  h4: ({ content }) => <Heading level={4}>{content}</Heading>,
  h5: ({ content }) => (
    <Piv as="h5" class="Markdown-heading">
      {content}
    </Piv>
  ),
  h6: ({ content }) => (
    <Piv as="h6" class="Markdown-heading">
      {content}
    </Piv>
  ),
  paragraph: ({ content }) => (
    <Piv as="p" class="Markdown-paragraph">
      {content}
    </Piv>
  ),
  strong: ({ content }) => <Piv as="strong">{content}</Piv>,
  emphasis: ({ content }) => <Piv as="em">{content}</Piv>,
  deletion: ({ content }) => <Piv as="del">{content}</Piv>,
  blockquote: ({ content }) => (
    <Piv as="blockquote" class="Markdown-quote">
      {content}
    </Piv>
  ),
  link: ({ href, title, content }) =>
    href === undefined ? (
      content
    ) : (
      <Link href={href} htmlProps={{ title }}>
        {content}
      </Link>
    ),
  image: ({ src, alt, title }) => (
    <Piv as="img" htmlProps={{ src, alt, title }} />
  ),
  list: ({ ordered, start, content }) =>
    ordered ? (
      <Piv as="ol" class="Markdown-list" htmlProps={{ start }}>
        {content}
      </Piv>
    ) : (
      <Piv as="ul" class="Markdown-list">
        {content}
      </Piv>
    ),
  listItem: ({ content }) => (
    <Piv as="li" class="Markdown-list-item">
      {content}
    </Piv>
  ),
  checkbox: ({ checked }) => (
    <Piv
      as="input"
      htmlProps={{
        'type': 'checkbox',
        checked,
        'disabled': true,
        'aria-label': checked ? '已完成' : '未完成',
      }}
    />
  ),
  table: ({ content }) => (
    <Piv as="table" class="Markdown-table">
      {content}
    </Piv>
  ),
  tableRow: ({ content }) => <Piv as="tr">{content}</Piv>,
  tableCell: ({ header, align, content }) =>
    header ? (
      <Piv
        as="th"
        class="Markdown-cell"
        htmlProps={{ 'data-align': align, 'scope': 'col' }}
      >
        {content}
      </Piv>
    ) : (
      <Piv as="td" class="Markdown-cell" htmlProps={{ 'data-align': align }}>
        {content}
      </Piv>
    ),
  inlineCode: ({ content }) => (
    <Piv as="code" class="Markdown-inline-code">
      {content}
    </Piv>
  ),
  codeBlock: ({ content, language }) => (
    <Piv as="pre" class="Markdown-code-block">
      <Piv as="code" htmlProps={{ 'data-language': language }}>
        {content}
      </Piv>
    </Piv>
  ),
  text: ({ content }) => content,
  html: ({ content }) => content,
  thematicBreak: () => <Piv as="hr" class="Markdown-separator" />,
  break: () => <Piv as="br" />,
}

/**
 * 将内容树递归转换为 JSX；自定义函数存在时完整保留其返回值。
 * 子内容先完成呈现，再作为 content 交给父节点。
 */
export function renderMarkdown(
  nodes: MarkdownNode[],
  renderers?: MarkdownRenderers,
): JSX.Element {
  /**
   * 选择当前类型的渲染函数，未声明时才使用默认呈现。
   */
  function render<Key extends keyof MarkdownRendererInputs>(
    type: Key,
    input: MarkdownRendererInputs[Key],
  ): JSX.Element {
    return (renderers?.[type] ?? defaultRenderers[type])(input)
  }
  /**
   * 呈现同一容器的内容，紧凑列表省略直接子段落的外壳。
   */
  function renderNodes(items: MarkdownNode[], tight = false): JSX.Element {
    return items.map((node) => {
      switch (node.type) {
        case 'heading':
          return render(`h${node.level}`, {
            content: renderNodes(node.children),
          })
        case 'paragraph':
          return tight
            ? renderNodes(node.children)
            : render('paragraph', { content: renderNodes(node.children) })
        case 'strong':
        case 'emphasis':
        case 'deletion':
        case 'blockquote':
          return render(node.type, { content: renderNodes(node.children) })
        case 'text':
        case 'html':
        case 'inlineCode':
          return render(node.type, { content: node.content })
        case 'codeBlock':
          return render('codeBlock', {
            content: node.content,
            language: node.language,
          })
        case 'thematicBreak':
        case 'break':
          return render(node.type, {})
        case 'checkbox':
          return render('checkbox', { checked: node.checked })
        case 'link':
          return render('link', {
            href: markdownUrl(node.href, false),
            title: node.title,
            content: renderNodes(node.children),
          })
        case 'image':
          return render('image', {
            src: markdownUrl(node.src, true),
            title: node.title,
            alt: node.alt,
          })
        case 'list':
          return render('list', {
            ordered: node.ordered,
            start: node.start,
            content: node.items.map((item) =>
              render('listItem', {
                content: renderNodes(item.children, !node.loose),
                task: item.task,
                checked: item.checked,
              }),
            ),
          })
        case 'table': {
          /**
           * 呈现同一行的单元格，保留表头身份和每列对齐方式。
           */
          const row = (cells: MarkdownNode[][], header: boolean) =>
            render('tableRow', {
              header,
              content: cells.map((cell, index) =>
                render('tableCell', {
                  content: renderNodes(cell),
                  header,
                  align: node.align[index],
                }),
              ),
            })
          return render('table', {
            content: (
              <>
                <Piv as="thead">{row(node.header, true)}</Piv>
                <Piv as="tbody">
                  {node.rows.map((cells) => row(cells, false))}
                </Piv>
              </>
            ),
          })
        }
      }
    })
  }
  return renderNodes(nodes)
}

/**
 * 只交付阅读所需的相对地址与协议，避免 Markdown 链接执行脚本或嵌入文档。
 */
function markdownUrl(value: string, image: boolean): string | undefined {
  const scheme = value
    .replace(/[\u0000-\u0020\u007f]/g, '')
    .match(/^([a-z][a-z\d+.-]*):/i)?.[1]
    ?.toLowerCase()
  return scheme === undefined ||
    (image ? ['http', 'https'] : ['http', 'https', 'mailto', 'tel']).includes(
      scheme,
    )
    ? value
    : undefined
}
