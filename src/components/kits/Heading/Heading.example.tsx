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
      <Text p>一级标题说明整篇文档的主题。</Text>
      <Heading level={2}>开始使用</Heading>
      <Text p>二级标题划分主要章节。</Text>
      <Heading level={3}>准备工作</Heading>
      <Text p>三级标题说明章节中的具体步骤。</Text>
    </Flow>
  )
}
