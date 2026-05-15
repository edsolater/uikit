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
      <ButtonDemo />
      <PopoverDemo />
      <UseTitleDemo />
    </main>
  )
}

export default App
