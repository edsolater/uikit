/**
 * 响应式重复内容示例。
 *
 * 展示列表追加后真实条目更新与空列表反馈。
 *
 * 让使用者直接观察 Loop 对重复内容的维护。
 */
import { Button, Loop, Flow, Heading, Text } from '@/components'
import { createState, val } from '@/foundation'

/**
 * 显示审核队列，可追加条目或清空队列观察空状态。
 */
export function LoopExample() {
  const items = createState(['核对结构', '检查输入输出'])
  return (
    <Flow>
      <Heading level={2}>Loop · 审核队列</Heading>
      <Flow direction="row">
        <Button
          onClick={() => {
            items.set([...val(items), `新增检查 ${val(items).length + 1}`])
          }}
        >
          添加检查
        </Button>
        <Button
          onClick={() => {
            items.set([])
          }}
        >
          清空队列
        </Button>
      </Flow>
      <Loop each={() => val(items)} fallback={<Text>暂无检查项</Text>}>
        {(item) => <Text p>{item}</Text>}
      </Loop>
    </Flow>
  )
}
