/**
 * Markdown 行内语法解析。
 *
 * 识别代码、强调、链接、图片、换行和转义，返回自有内容节点。
 *
 * 未闭合的语法保留文字，代码内容不参与实体或强调解释。
 */
import type { MarkdownNode, MarkdownReferences } from './Markdown.syntax-tree'

/** 当前支持的常用命名实体；未知名称保留原文。 */
const namedEntities = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', '\u00a0'],
])

/**
 * 解码带分号的数字实体和六种常用命名实体，单次解码不追读输出。
 * 非法 Unicode 数值保留原文。
 */
export function decodeMarkdownText(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (raw, entity: string) => {
    if (!entity.startsWith('#')) return namedEntities.get(entity) ?? raw
    const code = /^#x/i.test(entity)
      ? parseInt(entity.slice(2), 16)
      : Number(entity.slice(1))
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code)
      : raw
  })
}

/**
 * 去掉地址中的 Markdown 标点转义，再解码实体；不处理代码文本。
 */
export function decodeMarkdownDestination(text: string): string {
  return decodeMarkdownText(
    text.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1'),
  )
}

/**
 * 识别一段行内内容，引用目标由所属文档提供；链接内部不再创建链接。
 */
export function parseMarkdownInline(
  source: string,
  references: MarkdownReferences,
  inLink = false,
): MarkdownNode[] {
  const nodes: MarkdownNode[] = []
  let index = 0,
    text = ''
  /**
   * 交付累积的普通文字，转义字符在外部单独交付以避免再次解码。
   */
  function flushText() {
    if (text) nodes.push({ type: 'text', content: decodeMarkdownText(text) })
    text = ''
  }
  while (index < source.length) {
    const rest = source.slice(index)
    const escape = /^\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/.exec(rest)
    if (escape) {
      flushText()
      nodes.push({ type: 'text', content: escape[1] })
      index += escape[0].length
      continue
    }
    const hardBreak = /^(?: {2,}|\\)\n/.exec(rest)
    if (hardBreak) {
      flushText()
      nodes.push({ type: 'break' })
      index += hardBreak[0].length
      continue
    }
    const ticks = /^`+/.exec(rest)?.[0]
    if (ticks) {
      const end = findCodeEnd(source, index + ticks.length, ticks.length)
      if (end >= 0) {
        flushText()
        let content = source
          .slice(index + ticks.length, end)
          .replace(/\n/g, ' ')
        if (/^ .* $/.test(content) && /[^ ]/.test(content))
          content = content.slice(1, -1)
        nodes.push({ type: 'inlineCode', content })
        index = end + ticks.length
        continue
      }
      text += ticks
      index += ticks.length
      continue
    }
    const image = rest.startsWith('![')
    if (image || (!inLink && rest.startsWith('['))) {
      const labelStart = index + (image ? 2 : 1)
      const close = findBracketEnd(source, labelStart, '[', ']')
      if (close >= 0) {
        const label = source.slice(labelStart, close)
        let end = close + 1
        let target: { href: string; title?: string } | undefined
        if (source[end] === '(') {
          const targetEnd = findBracketEnd(source, end + 1, '(', ')')
          if (targetEnd >= 0) {
            target = readMarkdownDestination(source.slice(end + 1, targetEnd))
            if (target) end = targetEnd + 1
          }
        } else {
          const reference = /^\[([^\]]*)\]/.exec(source.slice(end))
          const key = reference?.[1] || label
          target = references.get(key.trim().replace(/\s+/g, ' ').toLowerCase())
          if (target && reference) end += reference[0].length
        }
        if (target) {
          flushText()
          const children = parseMarkdownInline(label, references, true)
          nodes.push(
            image
              ? {
                  type: 'image',
                  src: target.href,
                  title: target.title,
                  alt: markdownInlineText(children),
                }
              : { type: 'link', ...target, children },
          )
          index = end
          continue
        }
      }
    }
    const auto =
      !inLink &&
      /^(?:<(https?:\/\/[^\s<>]+|mailto:[^\s<>]+)>|(https?:\/\/[^\s<>]+))/.exec(
        rest,
      )
    if (auto) {
      const href = auto[1] ?? auto[2].replace(/[.,!?;:]+$/, '')
      flushText()
      nodes.push({
        type: 'link',
        href,
        children: [{ type: 'text', content: href.replace(/^mailto:/, '') }],
      })
      index += auto[1] ? auto[0].length : href.length
      continue
    }
    const html = /^<!--[\s\S]*?-->|^<\/?[a-z][^>]*>/i.exec(rest)
    if (html) {
      flushText()
      nodes.push({ type: 'html', content: html[0] })
      index += html[0].length
      continue
    }
    const delimiter = /^(\*{1,3}|_{1,3}|~~)/.exec(rest)?.[0]
    if (
      delimiter &&
      !/^\s/.test(rest.slice(delimiter.length)) &&
      !(delimiter[0] === '_' && /[\p{L}\p{N}]/u.test(source[index - 1] ?? ''))
    ) {
      const close = findEmphasisEnd(source, index + delimiter.length, delimiter)
      if (close >= 0) {
        flushText()
        let children = parseMarkdownInline(
          source.slice(index + delimiter.length, close),
          references,
          inLink,
        )
        if (delimiter.length === 3) children = [{ type: 'emphasis', children }]
        nodes.push({
          type:
            delimiter === '~~'
              ? 'deletion'
              : delimiter.length >= 2
                ? 'strong'
                : 'emphasis',
          children,
        })
        index = close + delimiter.length
        continue
      }
    }
    text += source[index++]
  }
  flushText()
  return nodes
}

/**
 * 找到相同长度的反引号闭合串，较长或较短的串属于代码正文。
 */
function findCodeEnd(source: string, start: number, length: number): number {
  const pattern = /`+/g
  pattern.lastIndex = start
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)))
    if (match[0].length === length) return match.index
  return -1
}

/**
 * 找到成对括号的结束位置，跳过标签内代码、转义及带引号的链接标题。
 */
function findBracketEnd(
  source: string,
  start: number,
  open: string,
  close: string,
): number {
  let depth = 1,
    quote = ''
  for (let index = start; index < source.length; index++) {
    const char = source[index]
    if (char === '\\') {
      index++
      continue
    }
    if (open === '[' && char === '`') {
      const ticks = /^`+/.exec(source.slice(index))![0].length
      const end = findCodeEnd(source, index + ticks, ticks)
      if (end >= 0) {
        index = end + ticks - 1
        continue
      }
    }
    if (open === '(' && (char === '"' || char === "'")) {
      if (quote === char) quote = ''
      else if (!quote) quote = char
      continue
    }
    if (quote) continue
    if (char === open) depth++
    if (char === close && --depth === 0) return index
  }
  return -1
}

/**
 * 将括号内或引用定义中的目标解析为地址与可选引号标题。
 * 空地址合法；未闭合的标题不解释为有效链接。
 */
export function readMarkdownDestination(
  source: string,
): { href: string; title?: string } | undefined {
  const match =
    /^\s*(?:<([^<>\n]*)>|((?:\\.|[^\s])+?))?(?:\s+["']([\s\S]*)["'])?\s*$/.exec(
      source,
    )
  if (!match) return undefined
  return {
    href: decodeMarkdownDestination(match[1] ?? match[2] ?? ''),
    title:
      match[3] === undefined ? undefined : decodeMarkdownDestination(match[3]),
  }
}

/**
 * 识别强调闭合串，跳过代码和转义；未闭合时由调用方保留原文。
 */
function findEmphasisEnd(
  source: string,
  start: number,
  delimiter: string,
): number {
  for (let index = start; index < source.length; index++) {
    if (source[index] === '\\') {
      index++
      continue
    }
    const ticks = /^`+/.exec(source.slice(index))?.[0]
    if (ticks) {
      const end = findCodeEnd(source, index + ticks.length, ticks.length)
      if (end >= 0) {
        index = end + ticks.length - 1
        continue
      }
    }
    if (!source.startsWith(delimiter, index)) continue
    const run = new RegExp(
      `^${delimiter[0] === '*' ? '\\*' : delimiter[0]}+`,
    ).exec(source.slice(index))![0].length
    if (
      /\s/.test(source[index - 1]) ||
      (delimiter.length === 1 && run % 2 === 0)
    ) {
      index += run - 1
      continue
    }
    return index + Math.max(0, run - delimiter.length)
  }
  return -1
}

/**
 * 从行内节点取得图片替代文字，去掉强调与链接外壳。
 */
function markdownInlineText(nodes: MarkdownNode[]): string {
  return nodes
    .map((node) =>
      'children' in node
        ? markdownInlineText(node.children)
        : 'content' in node
          ? node.content
          : node.type === 'break'
            ? '\n'
            : node.type === 'image'
              ? node.alt
              : '',
    )
    .join('')
}
