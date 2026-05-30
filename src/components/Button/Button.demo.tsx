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
        <Button intent="accent" tone="solid">Accent solid</Button>
        <Button tone="solid">Solid</Button>
        <Button tone="normal">Normal</Button>
        <Button tone="soft">Soft</Button>
        <Button tone="plain">Plain</Button>
        <Button tone="solid" intent="danger" >Danger solid</Button>
        <Button status="loading">Loading</Button>
        <Button status="disabled">Disabled</Button>
      </div>
    </article>
  )
}
