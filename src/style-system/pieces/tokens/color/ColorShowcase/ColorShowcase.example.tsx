/**
 * 这个文件负责 颜色材料展柜 的装配。
 * 它只负责两个子组件的组合入口，不承载 theme mode 或 color token 的领域逻辑。
 */
import { ThemeModeControl } from './ColorSchemeControl'
import { ColorShowcaseTable } from './ColorShowcaseTable'

export function ColorShowcase() {
  return (
    <section>
      <h2>颜色材料展柜</h2>
      <ThemeModeControl />
      <ColorShowcaseTable />
    </section>
  )
}
