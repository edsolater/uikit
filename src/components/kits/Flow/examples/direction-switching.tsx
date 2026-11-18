/**
 * Flow 的默认排列与可选配置示例。
 *
 * 用 $col 切换排列，并展示 $styleConfig 来源优先。
 *
 * 让使用者观察无需配置的效果，以及确有排列差异时的用法。
 */
import { Button, Flow, Text } from '../../..'
import { createState } from '@/foundation'
/**
 * 按默认横排显示同组动作，操作按钮可切换为纵向排列或恢复默认。
 */
export function DirectionSwitchingExample() {
  const column = createState(false)
  return (
    <Flow>
      <Text>默认排列相关操作，按钮保留自己的外观。</Text>
      <Button
        onClick={() => {
          column.set((value) => !value)
        }}
      >
        切换排列方向
      </Button>
      <Flow $col={column}>
        <Button>保存草稿</Button>
        <Button outlined>提交审核</Button>
        <Button plain>取消</Button>
      </Flow>
      <Flow $col $styleConfig={{ $row: true }}>
        <Text>快捷属性声明纵排。</Text>
        <Text>显式 $styleConfig 优先，最终仍按横排显示。</Text>
      </Flow>
      <Flow $col $height="8rem" $overflowY="auto" label="固定高度的内容流">
        <Text p>固定高度，较长内容在本区域滚动阅读。</Text>
        {Array.from({ length: 8 }, (_, index) => (
          <Text p>{`第 ${index + 1} 段内容`}</Text>
        ))}
      </Flow>
    </Flow>
  )
}
