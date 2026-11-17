/**
 * Flow 的默认排列与可选配置示例。
 *
 * 用美元前缀属性切换排列，并展示显式配置的同名字段优先。
 *
 * 让使用者观察无需配置的效果，以及确有排列差异时的用法。
 */
import { Button, Flow, Text, type FlowStyleConfig } from '../../..'
import { createState } from '@/foundation'
/**
 * 按默认横排显示同组动作，操作按钮可切换为纵向排列或恢复默认。
 */
export function DirectionSwitchingExample() {
  const direction = createState<FlowStyleConfig['$direction']>()
  return (
    <Flow>
      <Text>默认排列相关操作，按钮保留自己的外观。</Text>
      <Button
        onClick={() => {
          direction.set((value) => (value ? undefined : 'column'))
        }}
      >
        切换排列方向
      </Button>
      <Flow $direction={direction}>
        <Button>保存草稿</Button>
        <Button outlined>提交审核</Button>
        <Button plain>取消</Button>
      </Flow>
      <Flow $direction="column" $styleConfig={{ $direction: 'row' }}>
        <Text>前缀属性声明纵排。</Text>
        <Text>显式 $styleConfig 优先，最终仍按横排显示。</Text>
      </Flow>
    </Flow>
  )
}
