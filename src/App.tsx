import { useState } from 'react'
import { Button } from './components/Button'
import { useTitle } from './hooks/useTitle'
import './App.css'

function App() {
  const titles = ['React Kit Demo', 'Button Preview', 'Hook Preview']
  const [titleIndex, setTitleIndex] = useState(0)
  const currentTitle = useTitle(titles[titleIndex])

  return (
    <main className="demo-shell">
      <section className="hero">
        <span className="eyebrow">React 19 / Component Kit</span>
        <h1>轻量、直接、只做基础能力。</h1>
        <p className="hero-copy">
          这里保留一个最小 demo，用来验证基础组件和 hook。真正对外导出的入口在
          <code>src/index.ts</code>。
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <span>Component</span>
            <h2>Button</h2>
          </div>
          <p>只保留常用按钮能力，样式足够清晰，不做额外抽象。</p>
          <div className="button-row">
            <Button>Primary action</Button>
            <Button variant="ghost">Secondary action</Button>
            <Button disabled>Disabled</Button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <span>Hook</span>
            <h2>useTitle</h2>
          </div>
          <p>当前浏览器标题会随按钮切换并实时返回。</p>
          <div className="title-card">
            <strong>{currentTitle}</strong>
            <Button
              variant="ghost"
              onClick={() => setTitleIndex((titleIndex + 1) % titles.length)}
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
