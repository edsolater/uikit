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
      <p>按钮只表达动作声量、动作性质和交互尺寸，不承载导航语义。</p>

      <div class="button-demo-grid">
        <div class="button-demo-head">类型</div>
        <div class="button-demo-head">默认</div>
        <div class="button-demo-head">悬停</div>
        <div class="button-demo-head">按下</div>
        <div class="button-demo-head">流程</div>

        <div class="button-demo-label">普通</div>
        <div><Button>Default</Button></div>
        <div class="button-demo-state-hover"><Button>Default</Button></div>
        <div class="button-demo-state-active"><Button>Default</Button></div>
        <div class="button-row">
          <Button status="loading">Loading</Button>
          <Button status="disabled">Disabled</Button>
        </div>

        <div class="button-demo-label">主操作</div>
        <div><Button tone="solid">Solid</Button></div>
        <div class="button-demo-state-hover"><Button tone="solid">Solid</Button></div>
        <div class="button-demo-state-active"><Button tone="solid">Solid</Button></div>
        <div class="button-row">
          <Button tone="solid" status="loading">Loading</Button>
          <Button tone="solid" status="disabled">Disabled</Button>
        </div>

        <div class="button-demo-label">推荐</div>
        <div><Button intent="accent" tone="solid">Accent</Button></div>
        <div class="button-demo-state-hover"><Button intent="accent" tone="solid">Accent</Button></div>
        <div class="button-demo-state-active"><Button intent="accent" tone="solid">Accent</Button></div>
        <div class="button-row">
          <Button intent="accent" tone="solid" status="loading">Loading</Button>
          <Button intent="accent" tone="solid" status="disabled">Disabled</Button>
        </div>

        <div class="button-demo-label">危险</div>
        <div><Button intent="danger" tone="solid">Danger</Button></div>
        <div class="button-demo-state-hover"><Button intent="danger" tone="solid">Danger</Button></div>
        <div class="button-demo-state-active"><Button intent="danger" tone="solid">Danger</Button></div>
        <div class="button-row">
          <Button intent="danger" tone="solid" status="loading">Loading</Button>
          <Button intent="danger" tone="solid" status="disabled">Disabled</Button>
        </div>

        <div class="button-demo-label">退场</div>
        <div><Button tone="bare">Bare</Button></div>
        <div class="button-demo-state-hover"><Button tone="bare">Bare</Button></div>
        <div class="button-demo-state-active"><Button tone="bare">Bare</Button></div>
        <div class="button-row">
          <Button tone="bare" status="loading">Loading</Button>
          <Button tone="bare" status="disabled">Disabled</Button>
        </div>
      </div>

      <div class="button-size-stack">
        <div class="button-demo-label">尺寸</div>
        <div class="button-row">
          <Button size="small">Small</Button>
          <Button>Medium</Button>
          <Button size="large">Large</Button>
          <Button size="xlarge">XLarge</Button>
        </div>
        <div class="button-row">
          <Button size="small" tone="solid">Small</Button>
          <Button tone="solid">Medium</Button>
          <Button size="large" tone="solid">Large</Button>
          <Button size="xlarge" tone="solid">XLarge</Button>
        </div>
      </div>
    </article>
  )
}
