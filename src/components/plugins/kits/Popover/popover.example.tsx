/**
 * Popover 能力的本地示例。
 *
 * 使用按钮和内容卡片展示双角色调用，不增加浮层组件外壳。
 */
import { Article } from '@/components/kits/Article/Article'
import { Button } from '@/components/kits/Button/Button'
import { Card } from '@/components/kits/Card/Card'
import { Text } from '@/components/kits/Text/Text'
import { popover } from './popover'

/**
 * 展示触发、内容与关闭操作。
 */
export function PopoverExample() {
  const { popoverTrigger, popoverBody } = popover({
    popoverBody: { anchorPosition: 'top', triggerMargin: '4px' },
  })
  return (
    <Card class="example-card">
      <Article>
        <div class="example-card-head"><span>能力</span><h2>Popover</h2></div>
        <Text p>按钮触发卡片，内容仍由使用方提供。</Text>
        <Button is={popoverTrigger}>打开说明</Button>
        <Card is={popoverBody}>
          <Text p>这是锚定到按钮的补充内容。</Text>
          <Button on={{ click() { popoverBody.controller.hidePopover() } }}>关闭</Button>
        </Card>
      </Article>
    </Card>
  )
}
