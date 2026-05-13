/**
 * Popover 的本地 demo。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 */
import { Popover } from './Popover'

export function PopoverDemo() {
  return (
    <article class="panel">
      <div class="panel-head">
        <span>Component</span>
        <h2>Popover</h2>
      </div>
      <p>这个例子直接验证原生 Popover API、anchor positioning 和 border-shape 箭头。</p>
      <div class="popover-row">
        <Popover
          trigger="Bottom popover"
          title="最新 Chrome 原生浮层"
        >
          <p>这个 Popover 默认在触发器下方打开。</p>
          <p>当空间不够时，浏览器会按 `position-try` 自动尝试翻面。</p>
        </Popover>

        <Popover
          placement="right"
          trigger="Right popover"
          title="右侧定位"
        >
          <p>这个例子用于确认横向锚定也能正常工作。</p>
        </Popover>
      </div>
    </article>
  )
}