/**
 * Example 浏览入口：主页只负责发现，URL 选中具体条目后才渲染详情。
 * Example 内容继续留在各自领域旁边，本文件只拥有目录和浏览历史。
 */
import {
  onCleanup,
  onMount,
  createState,
  val,
  For,
  type Component,
} from '@/foundation'
import { FlowExample } from '@/components/kits/Flow/Flow.example'
import { GridExample } from '@/components/kits/Grid/Grid.example'
import { FieldExample } from '@/components/kits/Field/Field.example'
import { NavigationRegionExample } from '@/components/kits/NavigationRegion/NavigationRegion.example'
import { LinkExample } from '@/components/kits/Link/Link.example'
import { PageExample } from '@/components/kits/Page/Page.example'
import { TextAreaExample } from '@/components/kits/TextArea/TextArea.example'
import { SelectExample } from '@/components/kits/Select/Select.example'
import { CheckboxExample } from '@/components/kits/Checkbox/Checkbox.example'
import { DetailsExample } from '@/components/kits/Details/Details.example'
import { MessageBoardExample } from '@/components/kits/MessageBoard/MessageBoard.example'
import { TextExample } from '@/components/kits/Text/Text.example'
import { HeadingExample } from '@/components/kits/Heading/Heading.example'
import { LabelExample } from '@/components/kits/Label/Label.example'
import { HelpExample } from '@/components/kits/Help/Help.example'
import { TableExample } from '@/components/kits/Table/Table.example'
import { LoopExample } from '@/components/kits/Loop/Loop.example'
import { KitMarkerExample } from '@/components/tools/KitMarker/KitMarker.example'
import { KitMarkerStructureViewTriggerExample } from '@/components/tools/KitMarker/KitMarkerStructureViewTrigger.example'
import { AsyncStateExample } from '@/foundation/createState/AsyncState.example'
import { ButtonExample } from '@/components/kits/Button/Button.example'
import { Card, Flow } from '@/components'
import { CardExample } from '@/components/kits/Card/Card.example'
import { ArticleExample } from '@/components/kits/Article/Article.example'
import { InputExample } from '@/components/kits/Input/Input.example'
import { PopoverExample } from '@/components/plugins/kits/Popover/popover.example'
import { PopoverSurfaceExample } from '@/components/kits/Popover/PopoverSurface.example'
import { PivStructureExample } from '@/components/Piv/PivStructure.example'
import { DraggableExample } from '@/components/plugins/kits/dragAndDrop/draggable/draggable.example'
import { DroppableExample } from '@/components/plugins/kits/dragAndDrop/droppable/droppable.example'
import { DragAndDropExample } from '@/components/plugins/kits/dragAndDrop/dragAndDrop.example'
import { ColorShowcase } from '@/style-system/pieces/tokens/color/ColorShowcase/ColorShowcase.example'
import { UseDocumentTitleExample } from '@/hooks/useDocumentTitle/useDocumentTitle.example'
import './ExampleDashboard.style'
import './ExampleHome.style'

interface ExampleEntry {
  id: string
  title: string
  category: ExampleCategory
  /** 当前示例的信息意义层级，非 UI 机制条目不标组件层级。 */
  level?: 0 | 0.5 | 1 | 2
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
  semantic: { label: '语义组件', color: 'oklch(75% 0.07 225 / .9)' },
  component: { label: 'Component', color: 'oklch(75% 0.07 110 / .9)' },
  plugin: { label: 'Plugin', color: 'oklch(75% 0.07 100 / .9)' },
  piv: { label: 'Piv', color: 'oklch(75% 0.07 55 / .9)' },
  styleSystem: { label: 'Style System', color: 'oklch(75% 0.07 330 / .9)' },
  hook: { label: 'Hook', color: 'oklch(75% 0.07 85 / .9)' },
} satisfies Record<string, ExampleCategory>

/** 目录和截图共用的真实示例登记，图片只展示同一条目的内容。 */
export const exampleEntries: ExampleEntry[] = [
  {
    id: 'async-state',
    title: '异步状态',
    category: exampleCategories.hook,
    summary: '由界面处理请求等待、完成与失败。',
    thumbnail: new URL('../thumbnails/async-state.webp', import.meta.url).href,
    content: AsyncStateExample,
  },
  {
    id: 'card',
    level: 1,
    title: 'Card',
    category: exampleCategories.component,
    summary: '独立信息单元的声量、尺寸与主题材质。',
    thumbnail: new URL('../thumbnails/card.webp', import.meta.url).href,
    content: CardExample,
  },
  {
    id: 'article',
    level: 1,
    title: 'Article',
    category: exampleCategories.semantic,
    summary: '无容器皮肤的独立正文语义。',
    thumbnail: new URL('../thumbnails/article.webp', import.meta.url).href,
    content: ArticleExample,
  },
  {
    id: 'button',
    level: 0.5,
    title: 'Button',
    category: exampleCategories.component,
    summary: '动作声量、性质、状态与尺寸。',
    thumbnail: new URL('../thumbnails/button.webp', import.meta.url).href,
    content: ButtonExample,
  },
  {
    id: 'input',
    level: 0.5,
    title: 'Input',
    category: exampleCategories.component,
    summary: '单行输入值与校验状态。',
    thumbnail: new URL('../thumbnails/input.webp', import.meta.url).href,
    content: InputExample,
  },
  {
    id: 'popover',
    level: 0.5,
    title: 'Popover',
    category: exampleCategories.component,
    summary: '原生浮层、锚点定位与边框形状。',
    thumbnail: new URL('../thumbnails/popover.webp', import.meta.url).href,
    content: PopoverExample,
  },
  {
    id: 'draggable',
    title: 'Draggable',
    category: exampleCategories.plugin,
    summary: 'Top Layer 提升、Anchor 与指针拖动。',
    thumbnail: new URL('../thumbnails/draggable.webp', import.meta.url).href,
    content: DraggableExample,
  },
  {
    id: 'droppable',
    title: 'Droppable',
    category: exampleCategories.plugin,
    summary: '内部 payload 与系统文件接收。',
    thumbnail: new URL('../thumbnails/droppable.webp', import.meta.url).href,
    content: DroppableExample,
  },
  {
    id: 'drag-and-drop',
    title: 'Drag and Drop',
    category: exampleCategories.plugin,
    summary: '按共享标识分组的拖放协作。',
    thumbnail: new URL('../thumbnails/drag-and-drop.webp', import.meta.url).href,
    content: DragAndDropExample,
  },
  {
    id: 'piv-structure',
    level: 0,
    title: 'Piv Structure',
    category: exampleCategories.piv,
    summary: 'Plugin 对原始 DOM 结构的组合。',
    thumbnail: new URL('../thumbnails/piv-structure.webp', import.meta.url)
      .href,
    content: PivStructureExample,
  },
  {
    id: 'color',
    title: 'ColorShowcase',
    category: exampleCategories.styleSystem,
    summary: '主题模式与颜色 token。',
    thumbnail: new URL('../thumbnails/color.webp', import.meta.url).href,
    content: ColorShowcase,
  },
  {
    id: 'use-document-title',
    title: 'useDocumentTitle',
    category: exampleCategories.hook,
    summary: '浏览器标题的同步与读取。',
    thumbnail: new URL('../thumbnails/use-document-title.webp', import.meta.url)
      .href,
    content: UseDocumentTitleExample,
  },
  {
    id: 'flow',
    level: 0.5,
    title: 'Flow',
    category: exampleCategories.component,
    summary: '方向切换与顺序排列。',
    thumbnail: new URL('../thumbnails/flow.webp', import.meta.url).href,
    content: FlowExample,
  },
  {
    id: 'grid',
    level: 0.5,
    title: 'Grid',
    category: exampleCategories.component,
    summary: '等宽分栏与窄屏单列。',
    thumbnail: new URL('../thumbnails/grid.webp', import.meta.url).href,
    content: GridExample,
  },
  {
    id: 'field',
    level: 0.5,
    title: 'Field',
    category: exampleCategories.component,
    summary: '字段标题与控件身份关联。',
    thumbnail: new URL('../thumbnails/field.webp', import.meta.url).href,
    content: FieldExample,
  },
  {
    id: 'navigation-region',
    level: 0.5,
    title: 'NavigationRegion',
    category: exampleCategories.component,
    summary: '具名导航区域与章节链接。',
    thumbnail: new URL('../thumbnails/navigation-region.webp', import.meta.url).href,
    content: NavigationRegionExample,
  },
  {
    id: 'link',
    level: 0.5,
    title: 'Link',
    category: exampleCategories.component,
    summary: '当前链接和另开页面。',
    thumbnail: new URL('../thumbnails/link.webp', import.meta.url).href,
    content: LinkExample,
  },
  {
    id: 'page',
    level: 2,
    title: 'Page',
    category: exampleCategories.component,
    summary: '页面标题、正文与动作组合。',
    thumbnail: new URL('../thumbnails/page.webp', import.meta.url).href,
    content: PageExample,
  },

  {
    id: 'text-area',
    level: 0.5,
    title: 'TextArea',
    category: exampleCategories.component,
    summary: '多行编辑与即时字数。',
    thumbnail: new URL('../thumbnails/text-area.webp', import.meta.url).href,
    content: TextAreaExample,
  },
  {
    id: 'select',
    level: 0.5,
    title: 'Select',
    category: exampleCategories.component,
    summary: '有限选项与当前选择。',
    thumbnail: new URL('../thumbnails/select.webp', import.meta.url).href,
    content: SelectExample,
  },
  {
    id: 'checkbox',
    level: 0.5,
    title: 'Checkbox',
    category: exampleCategories.component,
    summary: '可点击的二态确认选项。',
    thumbnail: new URL('../thumbnails/checkbox.webp', import.meta.url).href,
    content: CheckboxExample,
  },
  {
    id: 'details',
    level: 0.5,
    title: 'Details',
    category: exampleCategories.component,
    summary: '按需展开的阅读内容。',
    thumbnail: new URL('../thumbnails/details.webp', import.meta.url).href,
    content: DetailsExample,
  },
  {
    id: 'message-board',
    level: 1,
    title: 'MessageBoard',
    category: exampleCategories.component,
    summary: '不同语气的状态反馈。',
    thumbnail: new URL('../thumbnails/message-board.webp', import.meta.url)
      .href,
    content: MessageBoardExample,
  },
  {
    id: 'text',
    level: 1,
    title: 'Text',
    category: exampleCategories.component,
    summary: '文字语义与动态阅读进度。',
    thumbnail: new URL('../thumbnails/text.webp', import.meta.url).href,
    content: TextExample,
  },
  {
    id: 'heading',
    level: 1,
    title: 'Heading',
    category: exampleCategories.component,
    summary: '文档标题的层级关系。',
    thumbnail: new URL('../thumbnails/heading.webp', import.meta.url).href,
    content: HeadingExample,
  },
  {
    id: 'popover-surface',
    level: 0.5,
    title: 'PopoverSurface',
    category: exampleCategories.component,
    summary: '外部目标锚定与独立浮层。',
    thumbnail: new URL('../thumbnails/popover-surface.webp', import.meta.url).href,
    content: PopoverSurfaceExample,
  },
  {
    id: 'help',
    level: 1,
    title: 'Help',
    category: exampleCategories.component,
    summary: '独立帮助入口与模板说明。',
    thumbnail: new URL('../thumbnails/help.webp', import.meta.url).href,
    content: HelpExample,
  },
  {
    id: 'label',
    level: 1,
    title: 'Label',
    category: exampleCategories.component,
    summary: '字段聚焦与帮助说明。',
    thumbnail: new URL('../thumbnails/label.webp', import.meta.url).href,
    content: LabelExample,
  },
  {
    id: 'table',
    level: 2,
    title: 'Table',
    category: exampleCategories.component,
    summary: '记录、列顺序与中文表头。',
    thumbnail: new URL('../thumbnails/table.webp', import.meta.url).href,
    content: TableExample,
  },
  {
    id: 'loop',
    level: 0.5,
    title: 'Loop',
    category: exampleCategories.component,
    summary: '动态重复内容与空列表。',
    thumbnail: new URL('../thumbnails/loop.webp', import.meta.url).href,
    content: LoopExample,
  },
  {
    id: 'component-marker',
    level: 0.5,
    title: 'ComponentMarker',
    category: exampleCategories.component,
    summary: '透明组件边界与用途说明。',
    thumbnail: new URL('../thumbnails/component-marker.webp', import.meta.url)
      .href,
    content: KitMarkerExample,
  },
  {
    id: 'component-marker-structure-view-trigger',
    level: 0.5,
    title: 'ComponentMarkerStructureViewTrigger',
    category: exampleCategories.component,
    summary: '手动查看组件结构与继续操作。',
    thumbnail: new URL('../thumbnails/component-marker-structure-view-trigger.webp', import.meta.url)
      .href,
    content: KitMarkerStructureViewTriggerExample,
  },
]

export default function ExampleDashboard() {
  const pathname = createState(window.location.pathname)

  const syncLocation = () => pathname.set(window.location.pathname)

  onMount(() => window.addEventListener('popstate', syncLocation))
  onCleanup(() => window.removeEventListener('popstate', syncLocation))

  const navigate = (event: MouseEvent) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return

    event.preventDefault()
    const nextPath = (event.currentTarget as HTMLAnchorElement).pathname
    window.history.pushState(null, '', nextPath)
    pathname.set(nextPath)
    window.scrollTo({ top: 0 })
  }

  return (
    <div
      class="example-shell"
      role={readExampleId(val(pathname)) === 'page' ? undefined : 'main'}
    >
      {(() => {
        const id = readExampleId(val(pathname))
        if (!id) return <ExampleHome onNavigate={navigate} />

        const example = exampleEntries.find((entry) => entry.id === id)
        return example ? (
          <ExampleDetail entry={example} onNavigate={navigate} />
        ) : (
          <ExampleMissing id={id} onNavigate={navigate} />
        )
      })()}
    </div>
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
        <For each={exampleEntries}>
          {(entry) => (
            <a
              class="example-link"
              data-thumbnail
              href={`/examples/${entry.id}`}
              onClick={props.onNavigate}
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
              <span class="example-link-ribbon" style={{ '--example-category-color': entry.category.color }}>
                {entry.level === undefined
                  ? entry.category.label
                  : `${entry.category.label} · ${entry.level} 级`}
              </span>
              <div class="example-link-copy">
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </div>
            </a>
          )}
        </For>
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
      <a class="example-back" href="/examples" onClick={props.onNavigate}>
        ← 全部 Examples
      </a>
      <Content />
    </section>
  )
}

function ExampleMissing(props: {
  id: string
  onNavigate: (event: MouseEvent) => void
}) {
  return (
    <section class="example-missing">
      <Card class="example-card">
        <Flow>
          <div class="example-card-head">
            <span>Not Found</span>
            <h1>没有这个 Example</h1>
          </div>
          <p>URL 中的 Example 标识“{props.id}”不存在。</p>
          <a class="example-back" href="/examples" onClick={props.onNavigate}>
            返回主页
          </a>
        </Flow>
      </Card>
    </section>
  )
}

function readExampleId(pathname: string): string | undefined {
  const match = /^\/examples\/([^/]+)\/?$/.exec(pathname)
  return match ? decodeURIComponent(match[1]) : undefined
}
