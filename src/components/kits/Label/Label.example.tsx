/**
 * 字段标题与帮助说明示例。
 *
 * 展示标题点击聚焦和悬停、键盘焦点触发的补充说明。
 *
 * 使字段关联及帮助入口能在真实界面中试用。
 */
import { Flow, Heading, Input, Label, Text, Button, tooltip, type LabelController } from '@/components'
import { createRef } from '@/hooks/createRef'

/**
 * 显示一个具名输入，点击标题聚焦，停留在帮助按钮上可阅读说明。
 */
export function LabelExample() {
  const id = crypto.randomUUID()
  const [label, receiveLabel] = createRef<LabelController>()
  return (
    <Flow>
      <Heading level={2}>Label · 项目名称</Heading>
      <Text p>点击字段标题聚焦输入；悬停或聚焦问号查看帮助。</Text>
      <Label for={id} ref={receiveLabel} tooltip="使用团队熟悉的名称，便于在项目列表中查找。">
        项目名称
      </Label>
      <Input id={id} htmlProps={{ value: '我的工作台' }} />
      <Label
        for={id}
        tooltipTrigger="i"
        tooltip={<Flow>
          <Text p>在团队列表中展示的名称。</Text>
          <Text p>可随时修改，不改变项目身份。</Text>
        </Flow>}
      >
        模板说明
      </Label>
      <Button
        is={tooltip({ content: '保存当前项目名称。' })}
        // 演示特殊回调中的指令入口；初始界面仍在 Label Props 中声明。
        onClick={() => { label.props?.tooltip.set('名称已确认，可以继续编辑。') }}
      >
        保存
      </Button>
    </Flow>
  )
}
