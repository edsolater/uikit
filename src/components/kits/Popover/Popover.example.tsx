/**
 * Popover 的本地 Example。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 */
import { Popover } from './Popover'
import { Card } from '../Card/Card'
import { Article } from '../Article/Article'

export function PopoverExample() {
  return (
    <Article as={Card} class="example-card">
      <div class="example-card-head">
        <span>基础组件</span>
        <h2>Popover</h2>
      </div>
      <p>
        这个例子验证原生Popover、锚点定位，以及随空间回退换边的指向箭头。
      </p>
      <div class="popover-row">
        <Popover trigger="下方弹出" title="原生浮层">
          <p>这个 Popover 默认在触发器下方打开。</p>
          <p>当空间不够时，浏览器会按 `position-try` 自动尝试翻面。</p>
        </Popover>

        <Popover top trigger="上方弹出" title="上方定位">
          <p>这个例子验证上方锚定，以及再次点击触发器关闭浮层。</p>
        </Popover>

        <Popover right trigger="右侧弹出" title="右侧定位">
          <p>这个例子用于确认横向锚定也能正常工作。</p>
        </Popover>
      </div>
    </Article>
  )
}
