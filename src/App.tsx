/**
 * 这个文件只负责本地演示页面。
 * 它不参与发布包的正式导出边界，也不承载组件库 API 设计。
 * 本地开发需要快速验证组件和 hook 时，可以在这里组合最小示例。
 */
import { createSignal } from 'solid-js'
import { Button } from './components/Button'
import { useTitle } from './hooks/useTitle'
import './App.css'

function App() {
  const titles = ['Solid Kit Demo', 'Button Preview', 'Hook Preview']
  const [titleIndex, setTitleIndex] = createSignal(0)
  const currentTitle = useTitle(() => titles[titleIndex()])

  return (
    <main class="demo-shell">
      <section class="hero">
        <span class="eyebrow">SolidJS / Component Kit</span>
        <h1>轻量、直接、只做基础能力。</h1>
        <p class="hero-copy">
          这里保留一个最小 demo，用来验证基础组件和 hook。真正对外导出的入口在
          <code>src/index.ts</code>。
        </p>
      </section>

      <section class="panel-grid">
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
              onClick={() => setTitleIndex((titleIndex() + 1) % titles.length)}
            >
              Switch title
            </Button>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
