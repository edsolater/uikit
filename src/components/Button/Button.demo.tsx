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
      <div class="setting-list">
        <div class="setting-row">
          <div class="setting-copy">
            <strong>推荐动作</strong>
            <span>用于当前路径里最应该被看见的动作。</span>
          </div>
          <Button intent="accent" tone="solid">
            Accent solid
          </Button>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>普通动作</strong>
            <span>默认按钮保持中性，不主动染品牌色。</span>
          </div>
          <Button>Default</Button>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>主操作</strong>
            <span>明确需要更高权重时才使用 solid 声量。</span>
          </div>
          <Button tone="solid">Solid</Button>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>退场动作</strong>
            <span>低权重命令保留可点击性，但降低视觉存在感。</span>
          </div>
          <Button tone="bare">Bare</Button>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>危险动作</strong>
            <span>破坏性命令需要明确的状态色和边界。</span>
          </div>
          <Button tone="solid" intent="danger">
            Danger solid
          </Button>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>流程状态</strong>
            <span>loading 和 disabled 是外部流程注入的动作状态。</span>
          </div>
          <div class="button-row">
            <Button status="loading">Loading</Button>
            <Button status="disabled">Disabled</Button>
          </div>
        </div>
      </div>
    </article>
  )
}
