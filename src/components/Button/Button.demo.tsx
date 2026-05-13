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
      <p>只保留常用按钮能力，样式足够清晰，不做额外抽象。</p>
      <div class="button-row">
        <Button>Primary action</Button>
        <Button variant="ghost">Secondary action</Button>
        <Button disabled>Disabled</Button>
      </div>
    </article>
  )
}