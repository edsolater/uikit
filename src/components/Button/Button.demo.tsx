/**
 * Button 的本地 demo。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 */
import { Button } from './Button'

export function ButtonDemo() {
  return (
    <article class="panel">
      <div class="panel-head">
        <span>Component</span>
        <h2>Button</h2>
      </div>
      <p>按钮只表达动作声量、动作性质和交互尺度，不承载导航语义。</p>
      <div class="button-row">
        <Button intent="accent" tone="solid">保存</Button>
        <Button tone="normal">导出</Button>
        <Button tone="soft">取消</Button>
        <Button tone="plain">跳过</Button>
        <Button tone="solid" intent="danger" >移除</Button>
        <Button status="loading">保存中</Button>
        <Button status="disabled">不可用</Button>
      </div>
    </article>
  )
}
