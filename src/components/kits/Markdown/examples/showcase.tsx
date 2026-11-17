/**
 * Markdown 各使用场景的展示入口。
 *
 * 将代码原文与独立文件两种输入场景组织到同一页面。
 *
 * 示例目录只需登记一个入口，各场景仍在自己的文件中说明用法。
 */
import { Flow, Heading } from '../../..'
import { BasicUsageExample } from './basic-usage'
import { MarkdownFileExample } from './markdown-file'

/**
 * 按输入场景展示 Markdown 的基础用法与文件渲染。
 */
export function MarkdownExamples() {
  return (
    <Flow $col>
      <Heading level={1}>Markdown 阅读与定制</Heading>
      <BasicUsageExample />
      <MarkdownFileExample />
    </Flow>
  )
}
