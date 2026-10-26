/**
 * 这个文件只负责把 Example 浏览应用挂到 HTML 容器。
 * 它不参与组件库导出，也不定义任何对外 API。
 * 组件库发布入口始终是 src/index.ts。
 */
import { render } from '@/foundation'
import {
  KitContextRoot,
  type KitContextNode,
} from '@/components/kits/kitContext'
import App from './pages/ExampleDashboard'
import { cssRoot } from '@/style-system'

cssRoot.mount()
render(() => {
  const rootNode: KitContextNode = { isRoot: true }
  return (
    <KitContextRoot value={rootNode}>
      <App />
    </KitContextRoot>
  )
}, document.getElementById('root')!)
