/**
 * 纯文字呈现示例。
 *
 * 展示行内文字、段落及动态数字来源。
 *
 * 让使用者比较文字语义并观察来源更新。
 */
import { Button, Flow, Heading, Text } from '@/components'
import { createState, val } from '@/foundation'

/**
 * 显示阅读进度，点击按钮会更新同一文字来源。
 */
export function TextExample() {
  const count = createState(1)
  return (
    <Flow>
      <Heading level={2}>Text · 阅读进度</Heading>
      <Text p>段落承载完整说明，行内文字可用于紧凑的数据反馈。</Text>
      <Flow direction="row">
        <Text>已阅读章节</Text>
        <Text>{count}</Text>
      </Flow>
      <Button
        onClick={() => {
          count.set(val(count) + 1)
        }}
      >
        读完一章
      </Button>
    </Flow>
  )
}
