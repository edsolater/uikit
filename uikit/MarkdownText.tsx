/**
 * only markdown text (no table、image、bullet list ...)
 */
export default function MarkdownText({
  nodeTarget,
  children
}: {
  nodeTarget?: {
    link?: 'tag:a'
    italic?: 'tag:i'
  }
  children?: string
}) {
  return <div>{children?.match(/\((?<text>.*)\)\[(?<link>.*)\]/g)}</div>
}
