/**
 * Markdown 文档的块结构解析。
 *
 * 按行识别标题、段落、代码、引用、列表与表格，再解析其中的行内内容。
 *
 * 当前实现拥有明确的常用语法范围，不依赖外部解析器或完整 GFM 协议。
 */
import type {
  MarkdownListItem,
  MarkdownNode,
  MarkdownReferences,
} from './syntax-tree'
import { parseMarkdownInline, readMarkdownDestination } from './inline-parser'

/** 一行列表标记决定项目的缩进归属，而非只凭项目符号分组。 */
interface ListMarker {
  indent: number
  contentIndent: number
  ordered: boolean
  start?: number
  content: string
}

/**
 * 解析 Markdown 原文为自有内容树，统一换行并收集顶层引用链接。
 */
export function parseMarkdown(source: string): MarkdownNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const references: MarkdownReferences = new Map()
  let fence: string | undefined
  for (const line of lines) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker) {
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length)
        fence = undefined
      continue
    }
    if (fence) continue
    const definition = /^ {0,3}\[([^\]]+)\]:\s*(.*)$/.exec(line)
    if (definition) {
      const target = readMarkdownDestination(definition[2])
      if (target)
        references.set(
          definition[1].trim().replace(/\s+/g, ' ').toLowerCase(),
          target,
        )
    }
  }
  return parseBlocks(lines, references)
}

/**
 * 将同一缩进作用域中的行转换为块内容；列表和引用递归进入自己的行范围。
 */
function parseBlocks(
  lines: string[],
  references: MarkdownReferences,
): MarkdownNode[] {
  const nodes: MarkdownNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index++
      continue
    }
    const definition = /^ {0,3}\[([^\]]+)\]:\s*(.*)$/.exec(line)
    if (definition && readMarkdownDestination(definition[2])) {
      index++
      continue
    }
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      const content: string[] = []
      index++
      const close = new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},} *$`)
      while (index < lines.length && !close.test(lines[index]))
        content.push(lines[index++])
      if (index < lines.length) index++
      nodes.push({
        type: 'codeBlock',
        content: content.join('\n'),
        language: fence[2].trim().split(/\s+/)[0] || undefined,
      })
      continue
    }
    if (/^ {4}/.test(line)) {
      const content: string[] = []
      while (
        index < lines.length &&
        (/^ {4}/.test(lines[index]) || !lines[index].trim())
      )
        content.push(lines[index++].slice(4))
      while (content.at(-1) === '') content.pop()
      nodes.push({ type: 'codeBlock', content: content.join('\n') })
      continue
    }
    const heading = /^ {0,3}(#{1,6})(?:\s+|$)(.*)$/.exec(line)
    if (heading) {
      nodes.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseMarkdownInline(
          heading[2].replace(/\s+#+\s*$/, ''),
          references,
        ),
      })
      index++
      continue
    }
    if (isSeparator(line)) {
      nodes.push({ type: 'thematicBreak' })
      index++
      continue
    }
    if (/^ {0,3}>/.test(line)) {
      const content: string[] = []
      while (index < lines.length && /^ {0,3}>/.test(lines[index]))
        content.push(lines[index++].replace(/^ {0,3}> ?/, ''))
      nodes.push({
        type: 'blockquote',
        children: parseBlocks(content, references),
      })
      continue
    }
    const marker = readListMarker(line)
    if (marker && marker.indent <= 3) {
      const items: MarkdownListItem[] = []
      let loose = false
      while (index < lines.length) {
        const item = readListMarker(lines[index])
        if (
          !item ||
          item.indent !== marker.indent ||
          item.ordered !== marker.ordered
        )
          break
        const content = [item.content]
        index++
        let blank = false
        while (index < lines.length) {
          const next = lines[index]
          if (!next.trim()) {
            content.push('')
            blank = true
            index++
            continue
          }
          const sibling = readListMarker(next)
          if (sibling && sibling.indent === marker.indent) {
            loose ||= blank && sibling.ordered === marker.ordered
            break
          }
          const indent = /^ */.exec(next)![0].length
          if (indent < item.contentIndent) break
          content.push(next.slice(item.contentIndent))
          if (blank) loose = true
          blank = false
          index++
        }
        while (content.at(-1) === '') content.pop()
        const task = /^\[([ xX])\](?:\s+|$)/.exec(content[0])
        if (task) content[0] = content[0].slice(task[0].length)
        const children = parseBlocks(content, references)
        if (task) {
          const checkbox: MarkdownNode = {
            type: 'checkbox',
            checked: task[1].toLowerCase() === 'x',
          }
          if (children[0]?.type === 'paragraph')
            children[0].children.unshift(checkbox)
          else children.unshift(checkbox)
        }
        items.push({
          children,
          task: !!task,
          checked: task ? task[1].toLowerCase() === 'x' : undefined,
        })
      }
      nodes.push({
        type: 'list',
        ordered: marker.ordered,
        start: marker.start,
        loose,
        items,
      })
      continue
    }
    const align = readTableAlignment(lines[index + 1])
    if (
      line.includes('|') &&
      align &&
      splitTableRow(line).length === align.length
    ) {
      const header = splitTableRow(line).map(cell =>
        parseMarkdownInline(cell, references),
      )
      const rows: MarkdownNode[][][] = []
      index += 2
      while (
        index < lines.length &&
        lines[index].trim() &&
        lines[index].includes('|')
      ) {
        const cells = splitTableRow(lines[index++])
        rows.push(
          align.map((_, column) =>
            parseMarkdownInline(cells[column] ?? '', references),
          ),
        )
      }
      nodes.push({ type: 'table', align, header, rows })
      continue
    }
    if (/^ {0,3}(?:=+|-+)\s*$/.test(lines[index + 1] ?? '')) {
      nodes.push({
        type: 'heading',
        level: lines[index + 1].trim()[0] === '=' ? 1 : 2,
        children: parseMarkdownInline(line.trim(), references),
      })
      index += 2
      continue
    }
    const paragraph = [line]
    index++
    while (
      index < lines.length &&
      lines[index].trim() &&
      !startsBlock(lines[index]) &&
      !readTableAlignment(lines[index + 1])
    )
      paragraph.push(lines[index++])
    nodes.push({
      type: 'paragraph',
      children: parseMarkdownInline(paragraph.join('\n'), references),
    })
  }
  return nodes
}

/**
 * 读取列表项的内容起点，让后续缩进行仍属于当前项。
 */
function readListMarker(line: string): ListMarker | undefined {
  const match = /^( *)([-+*]|\d{1,9}[.)])( +)(.*)$/.exec(line)
  if (!match) return undefined
  const ordered = /^\d/.test(match[2])
  return {
    indent: match[1].length,
    contentIndent: match[1].length + match[2].length + match[3].length,
    ordered,
    start: ordered ? parseInt(match[2], 10) : undefined,
    content: match[4],
  }
}

/**
 * 判断一行是否开始新的独立块，用于结束普通段落。
 */
function startsBlock(line: string): boolean {
  return (
    /^ {0,3}(?:#{1,6}(?:\s|$)|`{3,}|~{3,}|>|\[[^\]]+\]:)/.test(line) ||
    isSeparator(line) ||
    !!readListMarker(line)
  )
}

/**
 * 识别至少三个同类分隔标记，允许标记之间带空格。
 */
function isSeparator(line: string): boolean {
  return /^ {0,3}(?:(?:\* *){3,}|(?:- *){3,}|(?:_ *){3,})$/.test(line)
}

/**
 * 拆分表格单元格；转义竖线和成对反引号里的竖线属于内容。
 */
function splitTableRow(line: string): string[] {
  const cells: string[] = []
  let cell = '',
    code = 0
  const source = line.trim()
  for (
    let index = source.startsWith('|') ? 1 : 0;
    index < source.length;
    index++
  ) {
    const char = source[index]
    if (char === '\\' && index + 1 < source.length) {
      cell += char + source[++index]
      continue
    }
    if (char === '`') {
      const ticks = /^`+/.exec(source.slice(index))![0].length
      if (!code) code = ticks
      else if (code === ticks) code = 0
      cell += '`'.repeat(ticks)
      index += ticks - 1
    } else if (char === '|' && !code) {
      cells.push(cell.trim())
      cell = ''
    } else cell += char
  }
  if (cell || !source.endsWith('|')) cells.push(cell.trim())
  return cells
}

/**
 * 识别表格分隔行并取得每列的对齐方式，非分隔行不消费。
 */
function readTableAlignment(
  line?: string,
): Array<'left' | 'center' | 'right' | null> | undefined {
  if (!line) return undefined
  const cells = splitTableRow(line)
  if (!cells.length || !cells.every(cell => /^:?-{3,}:?$/.test(cell)))
    return undefined
  return cells.map(cell =>
    cell.startsWith(':') && cell.endsWith(':')
      ? 'center'
      : cell.endsWith(':')
        ? 'right'
        : cell.startsWith(':')
          ? 'left'
          : null,
  )
}
