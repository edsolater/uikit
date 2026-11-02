/**
 * KitMarker 结构查看激活器的使用示例。
 *
 * 提供可手动开启、关闭的组件身份与用途标注。
 *
 * 帮助使用者检查真实页面组合，同时保持默认界面不变。
 */
import {
  Button,
  Card,
  Flow,
  Heading,
  KitMarkerStructureViewTrigger,
  Text,
} from '@/components'
import { createState, val } from '@/foundation'

/**
 * 显示可操作的计数卡片；查看模式关闭后继续保留当前计数。
 */
export function KitMarkerStructureViewTriggerExample() {
  const count = createState(0)
  return (
    <Flow>
      <Heading level={2}>ComponentMarkerStructureViewTrigger · 组件结构查看</Heading>
      <Text p>点击右下角开关检查组件边界，再关闭查看以继续操作。</Text>
      <Card description="记录本次操作次数">
        <Flow>
          <Text>{count.map((value) => `已操作 ${value} 次`)}</Text>
          <Button
            onClick={() => {
              count.set(val(count) + 1)
            }}
          >
            增加一次
          </Button>
        </Flow>
      </Card>
      <KitMarkerStructureViewTrigger />
    </Flow>
  )
}
