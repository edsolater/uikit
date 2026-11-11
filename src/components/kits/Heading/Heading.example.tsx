/**
 * 文档标题层级示例。
 *
 * 展示一篇说明中相邻标题的语义层级。
 *
 * 让使用者按内容结构选择标题，而非把字号当作层级。
 */
import { Flow, Heading, Text } from '@/components'

/**
 * 呈现指南、章节和小节的标题关系。
 */
export function HeadingExample() {
  return (
    <Flow>
      <Heading level={1}>Heading · 使用指南</Heading>
      <Text p>H1是整篇页面或文档的主题总入口。</Text>
      <Heading level={2}>标题结构</Heading>
      <Text p>H2划分主要职责或领域。</Text>
      <Heading level={3}>层级选择</Heading>
      <Text p>H3定位一个可以独立讨论的具体议题。</Text>
      <Heading level={4}>最小子主题</Heading>
      <Text p>
        H4是最小可定位引用的子主题；更细内容使用正文、列表或表格，不为字号继续加深。
      </Text>
    </Flow>
  )
}
