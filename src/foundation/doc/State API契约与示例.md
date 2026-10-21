本文整理 UIKit 当前 State 相关 API，供业务使用和后续契约修订。内容按 2026-10-21 的源码核对；“当前行为”记录已经实现的语义，不代表所有现状都应长期保留。异步目标与待裁决问题单独列出。

# 基本概念与入口

| 概念 | 含义 |
| --- | --- |
| `State<T>` | 可读取、可修改、可派生的状态 |
| `StateView<T>` | 可读取、可派生的状态视图，接口不提供 `.set()` |
| `Source<T>` | 接受普通值或状态来源的输入类型，供组件 props、函数参数使用 |

业务常用 API 可从包根导入；仓库内部也可以从所属领域导入：

```ts
import { createState, val, stateView, createEffect } from '@/foundation'
import { derive, mapSource, followState } from '@/hooks/stateUtils'
import { snapshot } from '@/hooks/snapshots'
```

来源需要继续传递时保留 Source，在最终消费处读取。读取只有发生在响应式计算中，才会建立相应依赖；在普通语句中保存 `val(source)` 的结果，只得到那一刻的值。

# 创建与读写

以下示例使用 `const count = createState(1)`。

| API | 用法 | 当前行为 |
| --- | --- | --- |
| `createState(value)` | `createState(1)` | 创建 `State<number>` |
| `createState<T>()` | `createState<number>()` | 初始值为 `undefined`，返回 `State<number \| undefined>` |
| `createState(() => value)` | `createState(() => expensiveInit())` | 初始化函数执行一次，不是持续派生计算 |
| `state.set(value)` | `count.set(3)` | 写入新值并返回 State 自身；与当前值严格相等时不通知变化 |
| `state.set(previous => next)` | `count.set(n => n + 1)` | 根据旧值更新 |
| `val(source)` | `val(count)` | 读取当前值，递归解除 StateView、PromiseLike 包装；当前空值读取为 `undefined` |
| `val(source, fallback)` | `val(count, 0)` | 最终结果为 `null` 或 `undefined` 时使用 fallback；fallback 可以是函数 |
| `state.read()` | `count.read()` | 读取自身直接保存的值，不继续递归解包；业务通常使用 `val()` |
| `state[Symbol.dispose]()` | `count[Symbol.dispose]()` | 当前为空操作，不代表销毁状态或停止所有消费者 |

函数作为数据时，通过外层函数区分初始化／更新操作与函数值：

```ts
const handler = createState(() => onClick)
handler.set(() => anotherOnClick)
```

`val(fn)` 保留普通函数，不调用它。对象状态的通知来自 `.set()`，直接修改对象内部字段不会自动触发这套 State 的通知。

# 派生与转换

| API | 用法 | 当前行为 |
| --- | --- | --- |
| `state.map(mapper)` | `count.map(n => n * 2)` | 返回 StateView，内部用 Solid memo 缓存结果 |
| `.map()` 返回 StateView | `selected.map(id => states[id])` | 跟随所返回视图的当前值 |
| `stateView(value)` | `stateView(10)` | 将普通值转换成 StateView；函数输入沿用 createState 的初始化处理 |
| `stateView(view)` | `stateView(count)` | 返回原有视图 |
| `stateView(source, mapper)` | `stateView(count, n => n * 2)` | 转换来源后派生 |
| `stateView(source, { map })` | `stateView(count, { map: n => n * 2 })` | 上一行的 options 写法 |
| `mapSource(source, mapper)` | `mapSource(count, n => n * 2)` | 执行 `stateView(source).map(mapper)` |
| `derive(source, mapper)` | `derive(count, n => n * 2)` | 当前调用 mapSource，行为相同 |
| `derive(source)` | `derive(count)` | 原样返回 source，不建立新计算 |
| `snapshot(tree)` | `snapshot({ count, values: [count] })` | 递归读取对象、数组中的 StateView，返回当前快照；不等待 Promise |

已有 State 时，直接使用 `.map()`：

```ts
const count = createState(1)
const doubled = count.map(n => n * 2)
createEffect(doubled, value => console.log(value))
```

派生视图属于创建时的响应式作用域。派生结果相等时，不重复通知消费者动作。

当前 `derive()` 不会自动解包数组中的来源。这与 Effect 的来源数组契约不同：

```ts
const price = createState(10)
const quantity = createState(2)
const total = derive([price, quantity], ([price, quantity]) =>
  val(price) * val(quantity),
)
```

# 当前异步行为

假设 `request` 是已经创建好的 `Promise<number>`。

| 用法 | 当前行为 |
| --- | --- |
| `stateView(request)` | 返回 `StateView<number \| undefined>`；等待时为 undefined，成功后更新，失败默认仍为 undefined |
| `val(request)` | 通过缓存的 Promise 转换视图读取，等待／失败默认返回 undefined |
| `val(request, 0)` | 等待／失败及最终空值使用 0 |
| `stateView(request, { defaultValue: 0 })` | 提供默认值；当前这一分支也会把成功结果中的 undefined 替换为默认值 |
| `stateView(request, { defaultValue: 0, errorValue: -1, onRejected })` | 等待用 0，失败用 -1，并调用错误回调；成功时写入实际结果 |
| `createState(request)` | State 直接保存 Promise；`.read()` 返回 Promise，`val()` 才继续转换读取 |
| `selected.map(id => loadItem(id))` | 派生视图保存返回的 Promise，尚未接入 Solid 原生异步派生语义 |

同一个 Promise 的默认转换视图按对象身份缓存。不要在响应式读取中反复现场创建新 Promise，再交给 `val()`；每个新 Promise 都会建立新的转换关系。

当前实现中，以下两种读取有区别：

```ts
const item = selectedId.map(id => loadItem(id))

item.read() // Promise 本身
val(item)   // UIKit 转换后的当前结果；等待时通常是 undefined
```

继续调用 `item.map(...)`，mapper 收到的也是 Promise 本身，并不是已完成的对象。

# 响应式动作与清理

| API | 用法 | 当前行为 |
| --- | --- | --- |
| `createEffect(source, action)` | `createEffect(count, n => update(n))` | 自动读取单个来源，再执行动作 |
| `createEffect(sources, action)` | `createEffect([price, quantity], ([p, q]) => update(p, q))` | 自动读取每项来源，保留位置关系 |
| `createEffect(compute, action)` | `createEffect(() => val(count) * 2, n => update(n))` | 第一阶段计算并跟踪依赖，第二阶段执行动作 |
| 异步计算形式 | `createEffect(() => loadItem(val(selectedId)), item => show(item))` | 计算函数直接交给 Solid，可进入原生异步计算路径 |
| 动作返回清理函数 | `createEffect(source, value => subscribe(value))` | subscribe 若返回清理函数，由 Solid 管理本轮资源释放 |
| `onCleanup(cleanup)` | `onCleanup(() => connection.close())` | 在当前响应式作用域登记清理 |
| `followState(target, source, transform?)` | `const stop = followState(copy, count)` | 将来源变化持续写入目标 State；调用 stop 停止跟随 |

Effect 使用优先级：单来源 → 多来源数组 → 计算函数。不要为了形式上采用单来源而制造无意义的派生状态。

第一阶段读取和跟踪依赖，第二阶段执行动作；动作中的读取不隐式增加依赖。动作返回的清理函数由 Solid 生命周期管理。

# 辅助与内部能力

| API | 入口与用法 | 当前状态 |
| --- | --- | --- |
| `isState(value)` | 包根／Foundation | 判断可写 State |
| `isStateView(value)` | 包根／Foundation | 判断 StateView，State 也属于 StateView |
| `isStateViewable(value)` | 包根／Foundation | 判断 StateView 或 PromiseLike，不包含普通值 |
| `stateBrand`、`stateViewBrand` | 包根／Foundation | 身份标记，业务通常不需要操作 |
| `createMemo` | `@/foundation/render`：`createMemo(() => computation())` | 内部导出，未由包根公开；`.map()` 已在内部使用 |
| `createRenderEffect` | Foundation 内部入口，参数形式与 createEffect 相同 | DOM 提交使用，未由包根公开 |
| `createReactionFn` | Foundation 内部入口：`const runner = createReactionFn(() => work(val(count)))` | 独立响应式运行器，提供 getResult、dispose 和 Symbol.dispose；首轮同步执行，跟踪动作内同步读取 |
| `createStateWithPrev()` | 包根／Hooks | 已导出但尚未实现，调用会抛错 |

`createReactionFn` 需要显式释放，不是两阶段 Effect 的替代入口。`followState` 当前使用它实现持续跟随。

| 类型 | 表达什么 |
| --- | --- |
| `State<T>` | 可写状态 |
| `StateView<T>` | 可读、可派生视图 |
| `Source<T>` | 普通值或来源；当前 Promise 输入要求目标类型允许 undefined |
| `StateViewable<T>` | StateView 或允许的 PromiseLike 来源 |
| `MayArraySource<T>` | 单值或列表来源，列表中的项目也可以独立为来源 |
| `Val<S>` | 对实际输入 S 递归解包后的读取类型 |
| `Snapshot<T>` | 树形快照结果类型，从 Hooks 导出 |
| `StateViewOptions<V, U>` | 转换后的映射配置 `{ map }` |
| `PromiseLikeStateViewOptions<D, E>` | defaultValue、errorValue、onRejected 配置 |

# 异步契约修订方向

本节是待实现、待细化的方向，不是当前 API 承诺。

目标是让同步与异步派生进入同一张 Solid 计算图，业务继续使用 StateView 和统一读取形式。业务可以不直接调用 createMemo，底层仍需要派生计算节点。

期望的表达：

```ts
const selectedId = createState('A')
const item = selectedId.map(id => loadItem(id))
const title = item.map(item => item.title)
```

期望 item 未就绪时，依赖它的 title 等待；结果就绪后继续计算；失败进入错误处理边界。当前实现尚不满足这段异步链。

修订时需要明确：

- `.map()`／`derive()` 如何把异步结果直接接入 Solid，并在类型上表达完成值。
- `val()` 如何区分未就绪、成功和失败；现有 defaultValue／errorValue 如何迁移。
- 可写 State 保存 Promise 数据，与异步派生计算之间的语义边界。
- UIKit 如何提供等待与错误展示边界；当前 Foundation 公开入口未提供 Loading、Errored。
- 组件子级查询何时就绪：尚未登记完成与就绪后没有匹配项必须区分；查询等待不能阻止子级继续创建。

# 源码依据

- [state.ts](../createState/state.ts)：状态创建、存储、写入与派生。
- [state-view.ts](../createState/state-view.ts)：视图协议与转换入口。
- [read.ts](../createState/read.ts)：val 及其类型。
- [source.ts](../createState/source.ts)：来源类型。
- [promise-like.ts](../createState/promise-like.ts)：当前 Promise 转换。
- [createEffect.ts](../createEffect.ts)：两阶段动作与生命周期。
- [stateUtils.ts](../../hooks/stateUtils.ts)：派生与跟随组合。
- [snapshots.ts](../../hooks/snapshots.ts)：树形快照。
- [index.ts](../../index.ts)：包根公开出口。
