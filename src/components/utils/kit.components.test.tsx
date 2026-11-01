/**
 * kit 组件公开泛型协议的类型验收。
 *
 * 保护实例 ref 的精确关联，以及异构集合不能写入专属泛型字段的边界。
 *
 * 只检查公开调用契约，不约束包装内部实现。
 */
import { expectTypeOf, test } from 'vitest'
import type { State } from '@/foundation'
import type { PivProps } from '@/components/Piv/Piv'
import {
  Article, Board, Card, Field, Loop, Table, Piv,
  type ArticleController, type ArticleProps, type ArticleDefaultProps,
  type BoardController, type CardController, type PopoverController,
} from '@/components'

/**
 * 编译期检查组件调用；不运行这些 JSX，避免给类型验收创建 DOM。
 */
function verifyGenericCalls() {
  const board = <Board<'button'> as="button" ref={controller => {
    expectTypeOf(controller).toEqualTypeOf<BoardController<'button'>>()
  }} domRef={element => { expectTypeOf(element).toEqualTypeOf<HTMLButtonElement>() }} />
  const card = <Card<'section'> as="section" ref={controller => {
    expectTypeOf(controller).toEqualTypeOf<CardController<'section'>>()
  }} />
  // @ts-expect-error 原生节点泛型与 as 必须一致。
  Board<'button'>({ as: 'a' })
  // @ts-expect-error Card 同样保留原生节点泛型约束。
  Card<'section'>({ as: 'button' })

  const loop = <Loop each={() => [{ name: '项' }]} ref={controller => {
    expectTypeOf(controller.each).toEqualTypeOf<State<() => { name: string }[]>>()
    // @ts-expect-error 列表内容工厂只由 Props 提供，不能通过实例 Controller 重放。
    controller.children.set(() => (_item: unknown) => null)
  }}>{(item, index) => {
    expectTypeOf(item).toEqualTypeOf<{ name: string }>()
    expectTypeOf(index()).toEqualTypeOf<number>()
    return item.name
  }}</Loop>
  // @ts-expect-error 列表项必须符合明确指定的 number。
  Loop<number>({ each: () => ['错误'], children: item => item })
  const field = <Field label="字段" ref={controller => {
    // @ts-expect-error Field 内容工厂同样不是可写状态。
    controller.children.set(() => (_id: string) => null)
  }}>{id => <Piv as="input" id={id} />}</Field>

  const table = <Table data={[{ amount: 1, title: '项' }]} renderParts={{ tableCell: {
    amount: value => { expectTypeOf(value).toEqualTypeOf<number>(); return value },
  } }} ref={controller => {
    expectTypeOf(controller.data).toEqualTypeOf<State<{ amount: number; title: string }[]>>()
  }} />
  // @ts-expect-error 列选择必须来自 Row 的 key。
  Table<{ amount: number }>({ data: [{ amount: 1 }], keys: ['missing'] })
  // @ts-expect-error 单元格渲染器必须接收该列的 number。
  Table<{ amount: number }>({ data: [{ amount: 1 }], renderParts: { tableCell: { amount: (value: string) => value } } })

  const Carrier = (props: PivProps<'article'> & { heading?: string }) => <Piv as="article">{props.heading}</Piv>
  const article = <Article as={Carrier} heading="正文" ref={controller => {
    expectTypeOf(controller).toEqualTypeOf<ArticleController>()
    // @ts-expect-error 表现组件只在构建时选择，不公开伪可写字段。
    controller.as.set(() => Carrier)
  }} />
  const ownProps: ArticleProps = { as: Carrier }
  // @ts-expect-error 无 as 分支不能接收表现组件。
  const defaultProps: ArticleDefaultProps = { as: Carrier }
  const RequiredCarrier = (props: PivProps<'article'> & { heading: string }) => <Piv as="article">{props.heading}</Piv>
  // @ts-expect-error 原承载约束要求组件可直接接收 PivProps，不放宽为额外必填字段。
  Article({ as: RequiredCarrier, heading: '正文' })
  // @ts-expect-error Article 不接受错误的承载字段类型。
  Article({ as: Carrier, heading: 1 })
  // @ts-expect-error Article ref 接收自有 Controller，不接收任意值。
  Article({ ref: (_controller: number) => {} })

  // @ts-expect-error 混合列表集合不承诺统一的项类型，each 只在精确实例 ref 中操作。
  Loop.controllers.each.set(() => () => [{}])
  // @ts-expect-error 列表工厂在任何 Controller 中都不存在。
  Loop.controllers.children.set(() => (_item: unknown) => null)
  // @ts-expect-error 异构 Row 集合不能用宽类型改写精确实例的数据。
  Table.controllers.data.set([{}])
  // @ts-expect-error 异构 Row 集合不能改写专属列。
  Table.controllers.keys.set(['missing'])
  // @ts-expect-error 异构 Row 集合不能替换专属渲染器。
  Table.controllers.renderParts.set({})
  // @ts-expect-error 混合原生节点集合不能改写节点专属引用。
  Board.controllers.domRef.set(() => (_element: HTMLButtonElement) => {})
  // @ts-expect-error Card 集合也不能向不同节点类型写入专属 HTML 字段。
  Card.controllers.htmlProps.set({ type: 'submit' })
  // @ts-expect-error 插件也绑定原生节点类型，只通过精确实例 ref 操作。
  Board.controllers.plugin.set(() => {})
  const popover = (_controller: PopoverController) => {
    // @ts-expect-error 挂载时初始打开配置只能通过 Props 提供。
    _controller.defaultOpen.set(true)
  }
  void [board, card, field, loop, table, article, ownProps, defaultProps, popover]
}
void verifyGenericCalls

test('kit 接入保留泛型调用与安全集合边界', () => {
  expectTypeOf(Loop.controllers).not.toHaveProperty('each')
  expectTypeOf(Table.controllers).not.toHaveProperty('data')
})
