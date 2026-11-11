/**
 * kit 组件公开泛型协议的类型验收。
 *
 * 保护实例 ref 的精确关联，以及异构集合不能写入专属泛型字段的边界。
 *
 * 只检查公开调用契约，不约束包装内部实现。
 */
import { expectTypeOf, test } from 'vitest'
import type { State } from '@/foundation'
import { createPopoverPlugins } from '@/components/plugins/kits/Popover/popover'
import { createInactivePlugin } from '@/components/plugins/tools/createInactivePlugin'
import {
  Article,
  Board,
  Button,
  Card,
  Field,
  Loop,
  Table,
  Piv,
  type ArticleController,
  type ArticleProps,
  type BoardController,
  type CardController,
} from '@/components'

/**
 * 编译期检查组件调用；不运行这些 JSX，避免给类型验收创建 DOM。
 */
function verifyGenericCalls() {
  const capability = createInactivePlugin({
    name: 'capability',
    pluginCore({ addProps }) {
      addProps({ class: 'capability' })
      return {}
    },
  })()
  Piv({ is: capability })
  Piv({ is: [capability, capability] })
  // @ts-expect-error 未调用的定义不能作为 Plugin。
  Piv({ is: createInactivePlugin })
  // @ts-expect-error 原 trait 入口已经退出。
  Piv({ trait: capability })
  // @ts-expect-error plugin 不再作为 Props。
  Piv({ plugin: capability })
  // @ts-expect-error plugins 不再作为 Props。
  Piv({ plugins: capability })
  // @ts-expect-error 没有 pluginIs Props。
  Piv({ pluginIs: capability })
  const board = (
    <Board<'button'>
      as="button"
      ref={(controller) => {
        expectTypeOf(controller).toEqualTypeOf<BoardController<'button'>>()
      }}
      domRef={(element) => {
        expectTypeOf(element).toEqualTypeOf<HTMLButtonElement>()
      }}
    />
  )
  const card = (
    <Card<'section'>
      as="section"
      ref={(controller) => {
        expectTypeOf(controller).toEqualTypeOf<CardController<'section'>>()
      }}
    />
  )
  // @ts-expect-error 原生节点泛型与 as 必须一致。
  Board<'button'>({ as: 'a' })
  // @ts-expect-error Card 同样保留原生节点泛型约束。
  Card<'section'>({ as: 'button' })

  const loop = (
    <Loop
      each={() => [{ name: '项' }]}
      ref={(controller) => {
        expectTypeOf(controller.props.each).toEqualTypeOf<
          State<() => { name: string }[]>
        >()
        // @ts-expect-error 列表内容工厂只由 Props 提供，不能通过实例 Controller 重放。
        controller.props.children.set(() => (_item: unknown) => null)
      }}
    >
      {(item, index) => {
        expectTypeOf(item).toEqualTypeOf<{ name: string }>()
        expectTypeOf(index()).toEqualTypeOf<number>()
        return item.name
      }}
    </Loop>
  )
  // @ts-expect-error 列表项必须符合明确指定的 number。
  Loop<number>({ each: () => ['错误'], children: (item) => item })
  const field = (
    <Field
      label="字段"
      ref={(controller) => {
        // @ts-expect-error Field 内容工厂同样不是可写状态。
        controller.props.children.set(() => (_id: string) => null)
      }}
    >
      {(id) => <Piv as="input" id={id} />}
    </Field>
  )

  const table = (
    <Table
      data={[{ amount: 1, title: '项' }]}
      renderParts={{
        tableCell: {
          amount: (value) => {
            expectTypeOf(value).toEqualTypeOf<number>()
            return value
          },
        },
      }}
      ref={(controller) => {
        expectTypeOf(controller.props.data).toEqualTypeOf<
          State<{ amount: number; title: string }[]>
        >()
      }}
    />
  )
  // @ts-expect-error 列选择必须来自 Row 的 key。
  Table<{ amount: number }>({ data: [{ amount: 1 }], keys: ['missing'] })
  // @ts-expect-error 单元格渲染器必须接收该列的 number。
  Table<{ amount: number }>({
    data: [{ amount: 1 }],
    renderParts: { tableCell: { amount: (value: string) => value } },
  })

  const article = (
    <Article
      ref={(controller) => {
        expectTypeOf(controller).toEqualTypeOf<ArticleController>()
        // @ts-expect-error Article 不提供根节点选择或承载组件状态。
        controller.props.as.set('section')
      }}
    />
  )
  const ownProps: ArticleProps = { children: '独立正文' }
  // @ts-expect-error 语义根固定，不接收 Card 承载协议。
  Article({ as: Card })
  // @ts-expect-error Article 不允许改为其他原生标签。
  Article({ as: 'section' })
  // @ts-expect-error Article 不接收 Card 的视觉分类。
  Article({ solid: true })
  // @ts-expect-error Card 不提供内容身份模式。
  Card({ is: 'article' })
  // @ts-expect-error Article ref 接收自有 Controller。
  Article({ ref: (_controller: number) => {} })

  // @ts-expect-error 混合列表集合不承诺统一的项类型，each 只在精确实例 ref 中操作。
  Loop.controllers.props.each.set(() => () => [{}])
  // @ts-expect-error 列表工厂在任何 Controller 中都不存在。
  Loop.controllers.props.children.set(() => (_item: unknown) => null)
  // @ts-expect-error 异构 Row 集合不能用宽类型改写精确实例的数据。
  Table.controllers.props.data.set([{}])
  // @ts-expect-error 异构 Row 集合不能改写专属列。
  Table.controllers.props.keys.set(['missing'])
  // @ts-expect-error 异构 Row 集合不能替换专属渲染器。
  Table.controllers.props.renderParts.set({})
  // @ts-expect-error 混合原生节点集合不能改写节点专属引用。
  Board.controllers.props.domRef.set(() => (_element: HTMLButtonElement) => {})
  // @ts-expect-error Card 集合也不能向不同节点类型写入专属 HTML 字段。
  Card.controllers.props.htmlProps.set({ type: 'submit' })
  // @ts-expect-error 插件也绑定原生节点类型，只通过精确实例 ref 操作。
  Board.controllers.props.plugin.set(() => {})
  const {
    plugins: { trigger: popoverTrigger, body: popoverBody },
    controller: popoverController,
  } = createPopoverPlugins({ body: { defaultOpen: true } })
  const floating = (
    <>
      <Button is={popoverTrigger}>打开</Button>
      <Card is={popoverBody}>正文</Card>
    </>
  )
  popoverController.body.togglePopover({ force: true })

  void [board, card, field, loop, table, article, ownProps, floating]
}
void verifyGenericCalls

test('kit 接入保留泛型调用与安全集合边界', () => {
  expectTypeOf(Loop.controllers.props).not.toHaveProperty('each')
  expectTypeOf(Table.controllers.props).not.toHaveProperty('data')
})
