/**
 * Markdown 默认呈现与局部渲染替换的示例。
 *
 * 展示嵌套语法、表格和动态原文，定制函数通过 content 消费子内容。
 *
 * 让调用方直接看到同一份原文怎样使用不同呈现配置。
 */
import { Button, Flow, Heading, Markdown, Text } from '../../..'
import { createState } from '@/foundation'

const initialMarkdown = `## 认识 **Markdown**

段落可以组合 **加粗**、*强调*、~~删除线~~、[导航链接](https://example.com) 和 \`行内代码\`。

- 默认提供完整语义
  - 子列表保留嵌套层级
- [x] 渲染函数通过 content 接收内容
- [ ] 按需覆盖其他类型

| 类型 | 渲染入口 |
| :--- | ---: |
| 标题 | h1～h6 |
| 表格 | table、tableRow、tableCell |

> 引用中的 **行内语法** 也会递归渲染。

\`\`\`ts
const message = '你好，Markdown'
\`\`\`
`

/**
 * 通过编辑来源与局部标题覆盖，展示原文和配置的独立作用。
 */
export function BasicUsageExample() {
  const content = createState(initialMarkdown)
  return (
    <Flow $direction="column">
      <Heading level={2}>基础用法：直接提供原文</Heading>
      <Text>
        第一份使用默认呈现，第二份只替换二级标题；其余类型保留默认行为。
      </Text>
      <Button
        onClick={() => {
          content.set((value) =>
            value === initialMarkdown
              ? '## 原文已经更新\n\n新的 **内容** 会进入相同的渲染配置。'
              : initialMarkdown,
          )
        }}
      >
        切换原文
      </Button>
      <Markdown>{content}</Markdown>
      <Markdown
        renderers={{
          h2: ({ content }) => (
            <Heading level={3}>自定义标题：{content}</Heading>
          ),
        }}
      >
        {content}
      </Markdown>
    </Flow>
  )
}
