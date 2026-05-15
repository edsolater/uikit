/**
 * 这个文件负责 ColorDashboard 的 demo 装配。
 * 它只负责两个子组件的组合入口，不承载 color-scheme 或 color token 的领域逻辑。
 */
import { ColorSchemeControl } from './ColorSchemeControl'
import { ColorTokenTable } from './ColorTokenTable'

export function ColorDashboardDemo() {
  return (
    <section>
      <h2>Color Dashboard</h2>
      <ColorSchemeControl />
      <ColorTokenTable />
    </section>
  )
}