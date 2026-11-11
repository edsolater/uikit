/**
 * Grid 的列结构示例。
 *
 * 组合信息卡，切换等宽列并展示固定列与自动填充。
 *
 * 让使用者观察列数与窄屏退列的实际效果。
 */
import { Button, Card, Flow, Grid, Heading, Text } from '@/components'
import { createState } from '@/foundation'
/**
 * 选择列数，观察等宽分栏及窄屏自动收为单列。
 */
export function GridExample() {
  const columns = createState<1 | 2 | 3>(2)
  return (
    <Flow>
      <Text>窄屏自动回到单列，内容顺序保持不变。</Text>
      <Flow direction="row">
        <Button
          onClick={() => {
            columns.set(1)
          }}
        >
          一列
        </Button>
        <Button
          onClick={() => {
            columns.set(2)
          }}
        >
          两列
        </Button>
        <Button
          onClick={() => {
            columns.set(3)
          }}
        >
          三列
        </Button>
      </Flow>
      <Grid columns={columns}>
        <Card>
          <Heading level={3}>待处理</Heading>
          <Text>核对需求与输入。</Text>
        </Card>
        <Card>
          <Heading level={3}>进行中</Heading>
          <Text>完成当前模块。</Text>
        </Card>
        <Card>
          <Heading level={3}>已完成</Heading>
          <Text>整理结果与依据。</Text>
        </Card>
      </Grid>
      <Text>固定三列不随窄屏退列；自动填充列按可用空间排列。</Text>
      <Grid columns={3} responsive={false} label="固定三列">
        <Text>第一列</Text>
        <Text>第二列</Text>
        <Text>第三列</Text>
      </Grid>
      <Grid
        columns="repeat(auto-fit, minmax(8rem, 1fr))"
        responsive={false}
        label="自动填充"
      >
        <Text>自动填充一</Text>
        <Text>自动填充二</Text>
        <Text>自动填充三</Text>
      </Grid>
    </Flow>
  )
}
