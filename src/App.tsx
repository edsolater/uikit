/**
 * 这个文件只负责本地演示页面。
 * 它不参与发布包的正式导出边界，也不承载组件库 API 设计。
 * 本地开发需要快速验证组件和 hook 时，可以在这里组合最小示例。
 */
import { ButtonDemo } from './components/Button/Button.demo'
import { PopoverDemo } from './components/Popover/Popover.demo'
import { UseTitleDemo } from './hooks/useTitle/useTitle.demo'
import './App.css'

function App() {
  return (
    <main class="demo-shell">
      <section class="hero">
        <span class="eyebrow">SolidJS / Component Kit</span>
        <h1>轻量、直接、只做基础能力。</h1>
        <p class="hero-copy">
          这里保留一个最小 demo 首页，但具体例子都应就近落在各自主体目录。真正对外导出的入口在
          <code>src/index.ts</code>。
        </p>
      </section>

      <section class="panel-grid">
        <ButtonDemo />
        <PopoverDemo />
        <UseTitleDemo />
      </section>
    </main>
  )
}

export default App
