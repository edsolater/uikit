/**
 * 本地 Markdown 文件的渲染示例。
 *
 * 将相邻文件作为原文导入，再交给 Markdown 的 children。
 *
 * 文件读取由应用构建工具承担，组件只接收字符串。
 */
import { Flow, Heading, Markdown, Text } from '../../..'
import readingGuide from './reading-guide.md?raw'

/**
 * 展示通过 ?raw 导入的 Markdown 文件，沿用直接传入原文的组件契约。
 */
export function MarkdownFileExample() {
  return (
    <Flow $direction="column">
      <Heading level={2}>渲染 Markdown 文件</Heading>
      <Text>
        相邻的 reading-guide.md 通过 ?raw 导入，作为 children 交给 Markdown。
      </Text>
      <Markdown>{readingGuide}</Markdown>
    </Flow>
  )
}
