/**
 * Page 的页面组合示例。
 *
 * 组合标题、副标题、刷新动作和目标正文。
 *
 * 让使用者观察页面阅读范围及独立组件的组织关系。
 */
import { Button, Card, Flow, Heading, Page, Text, Checkbox } from '@/components'
import { createState } from '@/foundation'
/**
 * 组合页面标题、正文和刷新动作，显示已刷新次数。
 */
export function PageExample() {
  const count = createState(0)
  const showTitle = createState(true)
  return (
    <Page
      title={showTitle.map((show) => (show ? '项目概览' : undefined))}
      subtitle="查看当前工作的目标与进展。"
      actions={
        <Button
          onClick={() => {
            count.set((value) => value + 1)
          }}
        >
          刷新示例
        </Button>
      }
    >
      <Flow>
        <Checkbox
          label="显示内建页标题"
          checked={showTitle}
          onChange={showTitle.set}
        />
        <Text>{count.map((value) => '已刷新 ' + value + ' 次')}</Text>
        <Card>
          <Flow>
            <Heading level={2}>当前目标</Heading>
            <Text>让页面结构清晰，组件职责独立。</Text>
          </Flow>
        </Card>
      </Flow>
    </Page>
  )
}
