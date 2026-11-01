/**
 * 纯文字呈现示例。
 *
 * 展示行内文字、段落及动态数字来源。
 *
 * 让使用者比较文字语义并观察来源更新。
 */
import { Button, Flow, Heading, Text, type TextController } from '@/components'
import { createState, val } from '@/foundation'
import { createRef } from '@/hooks/createRef'

/**
 * 显示阅读进度，点击按钮会更新同一文字来源。
 */
export function TextExample() {
  const count = createState(1)
  const [progress, receiveProgress] = createRef<TextController>()
  return (
    <Flow>
      <Heading level={2}>Text · 阅读进度</Heading>
      <Text p>段落承载完整说明，行内文字可用于紧凑的数据反馈。</Text>
      <Flow direction="row">
        <Text>已阅读章节</Text>
        <Text ref={receiveProgress}>{count}</Text>
      </Flow>
      <Button
        onClick={() => {
          count.set(val(count) + 1)
        }}
      >
        读完一章
      </Button>
      <Button
        // 演示特殊命令对当前显示的干预；日常进度仍通过 count 来源更新。
        onClick={() => { progress.props?.children.set('本次阅读完成') }}
      >
        标记本次完成
      </Button>
    </Flow>
  )
}
