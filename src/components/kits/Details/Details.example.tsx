/**
 * Details 的折叠阅读示例。
 *
 * 通过原生摘要展开由内容流组织的检查说明。
 *
 * 让使用者验证鼠标和键盘展开，不混入容器皮肤。
 */
import { Details, Flow, Text } from '@/components'
/**
 * 通过摘要展开或收起补充阅读内容。
 */
export function DetailsExample() {
  return (
    <Details summary="展开检查说明">
      <Flow>
        <Text>先检查输入是否完整。</Text>
        <Text>再核对输出与验证依据。</Text>
        <Text>摘要可以通过鼠标或键盘展开。</Text>
      </Flow>
    </Details>
  )
}
