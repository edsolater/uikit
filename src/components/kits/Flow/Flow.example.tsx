/**
 * Flow 的方向交互示例。
 *
 * 组合按钮与内容流，切换横向和纵向排列。
 *
 * 让使用者直接比较方向改变后的动作布局。
 */
import { Button, Flow, Text } from '@/components'
import { createState } from '@/foundation'
/**
 * 切换方向，比较同组动作的横向与纵向排列。
 */
export function FlowExample() {
  const direction = createState<'row' | 'column'>('column')
  return (
    <Flow>
      <Text>内容流只负责方向，按钮保留自己的外观。</Text>
      <Button
        onClick={() => {
          direction.set((value) => (value === 'column' ? 'row' : 'column'))
        }}
      >
        切换排列方向
      </Button>
      <Flow direction={direction}>
        <Button>保存草稿</Button>
        <Button outlined>提交审核</Button>
        <Button plain>取消</Button>
      </Flow>
      <Flow direction="row" label="可伸展的内容区">
        <Flow width="10rem"><Text>固定宽度</Text></Flow>
        <Flow grow><Text>占用剩余空间</Text></Flow>
      </Flow>
    </Flow>
  )
}
