/**
 * Example 浏览入口：主页只负责发现，URL 选中具体条目后才渲染详情。
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
import './ExampleHome.css'

interface ExampleEntry {
  id: string
  title: string
  category: ExampleCategory
  summary: string
  thumbnail: string
  content: Component
}

interface ExampleCategory {
  label: string
  color: string
}

/** 类别的识别色属于 Example Home 条目信息；CSS 只消费颜色，不推断业务类别。 */
const exampleCategories = {
  component: { label: 'Component', color: 'oklch(75% 0.07 110 / .9)' },
  plugin: { label: 'Plugin', color: 'oklch(75% 0.07 100 / .9)' },
  piv: { label: 'Piv', color: 'oklch(75% 0.07 55 / .9)' },
  css: { label: 'CSS', color: 'oklch(75% 0.07 330 / .9)' },
  hook: { label: 'Hook', color: 'oklch(75% 0.07 85 / .9)' },
} satisfies Record<string, ExampleCategory>

const exampleEntries: ExampleEntry[] = [
  { id: 'button', title: 'Button', category: exampleCategories.component, summary: '动作声量、性质、状态与尺寸。', thumbnail: new URL('../thumbnails/button.webp', import.meta.url).href, content: ButtonExample },
  { id: 'input', title: 'Input', category: exampleCategories.component, summary: '单行输入值与校验状态。', thumbnail: new URL('../thumbnails/input.webp', import.meta.url).href, content: InputExample },
  { id: 'popover', title: 'Popover', category: exampleCategories.component, summary: '原生浮层、锚点定位与边框形状。', thumbnail: new URL('../thumbnails/popover.webp', import.meta.url).href, content: PopoverExample },
  { id: 'draggable', title: 'Draggable', category: exampleCategories.plugin, summary: 'Top Layer 提升、Anchor 与指针拖动。', thumbnail: new URL('../thumbnails/draggable.webp', import.meta.url).href, content: DraggableExample },
  { id: 'droppable', title: 'Droppable', category: exampleCategories.plugin, summary: '内部 payload 与系统文件接收。', thumbnail: new URL('../thumbnails/droppable.webp', import.meta.url).href, content: DroppableExample },
  { id: 'scope', title: 'Scope', category: exampleCategories.plugin, summary: '能力组合的作用域边界。', thumbnail: new URL('../thumbnails/scope.webp', import.meta.url).href, content: ScopeExample },
  { id: 'piv-structure', title: 'Piv Structure', category: exampleCategories.piv, summary: 'Plugin 对原始 DOM 结构的组合。', thumbnail: new URL('../thumbnails/piv-structure.webp', import.meta.url).href, content: PivStructureExample },
  { id: 'color', title: 'Color', category: exampleCategories.css, summary: '主题模式与颜色 token。', thumbnail: new URL('../thumbnails/color.webp', import.meta.url).href, content: ColorDashboardExample },
  { id: 'use-document-title', title: 'useDocumentTitle', category: exampleCategories.hook, summary: '浏览器标题的同步与读取。', thumbnail: new URL('../thumbnails/use-document-title.webp', import.meta.url).href, content: UseDocumentTitleExample },
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
        if (!id) return <ExampleHome onNavigate={navigate} />

        const example = exampleEntries.find(entry => entry.id === id)
        return example
          ? <ExampleDetail entry={example} onNavigate={navigate} />
          : <ExampleMissing id={id} onNavigate={navigate} />
      })()}
    </main>
  )
}

function ExampleHome(props: { onNavigate: (event: MouseEvent) => void }) {
  return (
    <section class="example-home">
      <header class="example-home-head">
        <span class="example-home-kicker">UIKit</span>
        <h1>Examples</h1>
      </header>

      <nav class="example-list" aria-label="Examples">
        <For each={exampleEntries}>{entry => (
          <a
            class="example-link"
            data-thumbnail
            href={`/examples/${entry.id}`}
            onClick={props.onNavigate}
            style={{ '--example-category-color': entry.category.color }}
          >
            <img
              class="example-link-thumbnail"
              src={entry.thumbnail}
              alt=""
              width="800"
              height="450"
              loading="lazy"
              decoding="async"
            />
            <span class="example-link-ribbon">{entry.category.label}</span>
            <div class="example-link-copy">
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
            </div>
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
    <section class="example-missing">
      <article class="panel">
        <div class="panel-head">
          <span>Not Found</span>
          <h1>没有这个 Example</h1>
        </div>
        <p>URL 中的 Example 标识“{props.id}”不存在。</p>
        <a class="example-back" href="/examples" onClick={props.onNavigate}>返回主页</a>
      </article>
    </section>
  )
}

function readExampleId(pathname: string): string | undefined {
  const match = /^\/examples\/([^/]+)\/?$/.exec(pathname)
  return match ? decodeURIComponent(match[1]) : undefined
}
