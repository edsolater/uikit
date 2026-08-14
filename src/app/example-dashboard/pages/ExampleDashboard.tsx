/**
 * Example 浏览入口：索引只负责发现，URL 选中具体条目后才渲染详情。
 * Example 内容继续留在各自领域旁边，本文件只拥有目录和浏览历史。
 */
import { createSignal, For, onCleanup, onMount, type Component } from 'solid-js'
import { ButtonExample } from '../../../components/kits/Button/Button.example'
import { InputExample } from '../../../components/kits/Input/Input.example'
import { PopoverExample } from '../../../components/kits/Popover/Popover.example'
import { PivStructureExample } from '../../../components/Piv/PivStructure.example'
import { DraggableExample } from '../../../components/plugins/kits/draggable/draggable.example'
import { DroppableExample } from '../../../components/plugins/kits/droppable/droppable.example'
import { ScopeExample } from '../../../components/plugins/kits/scope/scope.example'
import { ColorDashboardExample } from '../../../css/ColorDashboardExample'
import { UseDocumentTitleExample } from '../../../hooks/useDocumentTitle/useDocumentTitle.example'
import './ExampleDashboard.css'

interface ExampleEntry {
  id: string
  title: string
  category: string
  summary: string
  content: Component
}

const exampleEntries: ExampleEntry[] = [
  { id: 'button', title: 'Button', category: 'Component', summary: '动作声量、性质、状态与尺寸。', content: ButtonExample },
  { id: 'input', title: 'Input', category: 'Component', summary: '单行输入值与校验状态。', content: InputExample },
  { id: 'popover', title: 'Popover', category: 'Component', summary: '原生 Popover、Anchor Positioning 与边框形状。', content: PopoverExample },
  { id: 'piv-structure', title: 'Piv Structure', category: 'Piv', summary: 'Plugin 对原始 DOM 结构的组合方式。', content: PivStructureExample },
  { id: 'draggable', title: 'Draggable', category: 'Plugin', summary: '原始元素进入 Top Layer 后跟随指针。', content: DraggableExample },
  { id: 'droppable', title: 'Droppable', category: 'Plugin', summary: '接收内部 payload 与系统外部文件。', content: DroppableExample },
  { id: 'scope', title: 'Scope', category: 'Plugin', summary: '限制能力不能越过的组合边界。', content: ScopeExample },
  { id: 'color', title: 'Color', category: 'CSS', summary: '主题模式与颜色 token。', content: ColorDashboardExample },
  { id: 'use-document-title', title: 'useDocumentTitle', category: 'Hook', summary: '同步浏览器标题并读取当前结果。', content: UseDocumentTitleExample },
]

export default function ExampleDashboard() {
  const [pathname, setPathname] = createSignal(window.location.pathname)

  const syncLocation = () => setPathname(window.location.pathname)

  onMount(() => window.addEventListener('popstate', syncLocation))
  onCleanup(() => window.removeEventListener('popstate', syncLocation))

  const navigate = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    const nextPath = (event.currentTarget as HTMLAnchorElement).pathname
    window.history.pushState(null, '', nextPath)
    setPathname(nextPath)
    window.scrollTo({ top: 0 })
  }

  return (
    <main class="example-shell">
      {(() => {
        const id = readExampleId(pathname())
        if (!id) return <ExampleIndex onNavigate={navigate} />

        const example = exampleEntries.find(entry => entry.id === id)
        return example
          ? <ExampleDetail entry={example} onNavigate={navigate} />
          : <ExampleMissing id={id} onNavigate={navigate} />
      })()}
    </main>
  )
}

function ExampleIndex(props: { onNavigate: (event: MouseEvent) => void }) {
  return (
    <section class="example-index">
      <header class="panel">
        <div class="panel-head">
          <span>UIKit</span>
          <h1>Examples</h1>
        </div>
        <p>选择一个 Example 后进入独立详情；URL 可以直接保存、刷新和分享。</p>
      </header>

      <nav class="example-list" aria-label="Example 索引">
        <For each={exampleEntries}>{entry => (
          <a class="panel example-link" href={`/examples/${entry.id}`} onClick={props.onNavigate}>
            <div class="panel-head">
              <span>{entry.category}</span>
              <h2>{entry.title}</h2>
            </div>
            <p>{entry.summary}</p>
          </a>
        )}</For>
      </nav>
    </section>
  )
}

function ExampleDetail(props: {
  entry: ExampleEntry
  onNavigate: (event: MouseEvent) => void
}) {
  const Content = props.entry.content

  return (
    <section class="example-detail">
      <a class="example-back" href="/examples" onClick={props.onNavigate}>← 全部 Examples</a>
      <Content />
    </section>
  )
}

function ExampleMissing(props: { id: string; onNavigate: (event: MouseEvent) => void }) {
  return (
    <section class="example-index">
      <article class="panel">
        <div class="panel-head">
          <span>Not Found</span>
          <h1>没有这个 Example</h1>
        </div>
        <p>URL 中的 Example 标识“{props.id}”不存在。</p>
        <a class="example-back" href="/examples" onClick={props.onNavigate}>返回索引</a>
      </article>
    </section>
  )
}

function readExampleId(pathname: string): string | undefined {
  const match = /^\/examples\/([^/]+)\/?$/.exec(pathname)
  return match ? decodeURIComponent(match[1]) : undefined
}
