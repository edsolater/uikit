/**
 * 透明组件边界示例。
 *
 * 为一组内容登记共同身份与用途，并提供手动查看入口。
 *
 * 让使用者观察边界标注而不增加页面布局节点。
 */
import {
  Card,
  ComponentWrapper,
  Flow,
  Heading,
  StructureViewFab,
  Text,
} from '@/components'

/**
 * 呈现带自定义组件身份的信息组，查看开关初始关闭。
 */
export function ComponentWrapperExample() {
  return (
    <Flow>
      <Heading level={2}>ComponentWrapper · 透明边界</Heading>
      <Text p>
        点击右下角“打开组件定位框”可看到阅读摘要的共同边界；关闭后恢复正常内容。
      </Text>
      <ComponentWrapper
        componentName="ReadingSummary"
        description="概括本次阅读进度"
      >
        <Card>
          <Flow>
            <Heading level={3}>阅读摘要</Heading>
            <Text>已阅读 3 章，剩余 2 章。</Text>
          </Flow>
        </Card>
      </ComponentWrapper>
      <StructureViewFab />
    </Flow>
  )
}
