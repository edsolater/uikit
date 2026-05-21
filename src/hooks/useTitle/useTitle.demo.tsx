/**
 * useTitle 的本地 demo。
 * 它只服务本地 HTML 验证，不参与 hooks 正式导出。
 */
import { createSignal } from 'solid-js'
import { Button } from '../../components/Button'
import { useTitle } from './useTitle'

export function UseTitleDemo() {
  const titles = ['Solid Kit Demo', 'Button Preview', 'Hook Preview']
  const [titleIndex, setTitleIndex] = createSignal(0)
  const currentTitle = useTitle(() => titles[titleIndex()])

  return (
    <article class="panel">
      <div class="panel-head">
        <span>Hook</span>
        <h2>useTitle</h2>
      </div>
      <p>当前浏览器标题会随按钮切换，并实时返回。</p>
      <div class="title-card">
        <strong>{currentTitle()}</strong>
        <Button
          variant="ghost"
          onClick={() => {
            setTitleIndex((titleIndex() + 1) % titles.length)
          }}
        >
          Switch title
        </Button>
      </div>
    </article>
  )
}