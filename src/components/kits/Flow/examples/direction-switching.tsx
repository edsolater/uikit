/**
 * Flow 的默认排列与可选配置示例。
 *
 * 用默认横排组织相关操作，点击按钮后才声明纵向差异。
 *
 * 让使用者观察无需配置的效果，以及确有排列差异时的用法。
 */
import { Button, Flow, Text, type FlowStyleConfig } from '../../..'
import { createState } from '@/foundation'
/**
 * 按默认横排显示同组动作，操作按钮可切换为纵向排列或恢复默认。
 */
export function DirectionSwitchingExample() {
  const styleConfig = createState<FlowStyleConfig | undefined>()
  return (
    <Flow>
      <Text>默认排列相关操作，按钮保留自己的外观。</Text>
      <Button
        onClick={() => {
          styleConfig.set((value) =>
            value ? undefined : { direction: 'column' },
          )
        }}
      >
        切换排列方向
      </Button>
      <Flow styleConfig={styleConfig}>
        <Button>保存草稿</Button>
        <Button outlined>提交审核</Button>
        <Button plain>取消</Button>
      </Flow>
    </Flow>
  )
}
