/**
 * useDocumentTitle 的本地 demo。
 * 它只服务本地 HTML 验证，不参与 hooks 正式导出。
 */
import { Button } from '../../components/kits/Button'
import { createState, val } from '../createState'
import { useDocumentTitle } from './useDocumentTitle'

export function UseDocumentTitleDemo() {
  const titles = ['Solid Kit Demo', 'Button Preview', 'Hook Preview']
  const titleIndex = createState(0)
  const currentTitle = useDocumentTitle(() => titles[val(titleIndex)])

  return (
    <article class="panel">
      <div class="panel-head">
        <span>Hook</span>
        <h2>useDocumentTitle</h2>
      </div>
      <p>当前浏览器标题会随按钮切换，并实时返回。</p>
      <div class="title-card">
        <strong>{currentTitle()}</strong>
        <Button
          tone="bare"
          onClick={() => {
            titleIndex.set((index) => (index + 1) % titles.length)
          }}
        >
          Switch title
        </Button>
      </div>
    </article>
  )
}
