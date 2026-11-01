本文整理 UIKit 当前 State 相关 API，供业务使用和后续契约修订。内容按 2026-10-22 的 Solid 2 异步链路核对。默认读取保留原生等待和失败，业务通过 UI 边界处理。

# 基本概念与入口

| 概念           | 含义                                                       |
| -------------- | ---------------------------------------------------------- |
| `State<T>`     | 可读取、可修改、可派生的状态                               |
| `StateView<T>` | 可读取、可派生的状态视图，接口不提供 `.set()`              |
| `Source<T>`    | 接受普通值或状态来源的输入类型，供组件 props、函数参数使用 |

业务常用 API 可从包根导入；仓库内部也可以从所属领域导入：

```ts
import { createState, val, stateView, createEffect } from '@/foundation'
import { derive, mapSource } from '@/hooks/stateUtils'
import { snapshot } from '@/hooks/snapshots'
```

来源需要继续传递时保留 Source，在最终消费处读取。读取发生在响应式计算中时，会建立该计算对来源的依赖；保存 `val(source)` 得到的值，不会让这个变量自动跟随来源变化。

# 创建与读写

以下示例使用 `const count = createState(1)`。

| API                           | 用法                                 | 当前行为                                                                                          |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `createState(value)`          | `createState(1)`                     | 创建 `State<number>`                                                                              |
| `createState<T>()`            | `createState<number>()`              | 初始值为 `undefined`，返回 `State<number \| undefined>`                                           |
| `createState(() => value)`    | `createState(() => expensiveInit())` | 计算函数持续跟随同步读取的依赖，返回 Promise 时由 Solid 等待                                      |
| `state.set(value)`            | `count.set(3)`                       | 写入新值并返回 State 自身；与当前值严格相等时不通知变化                                           |
| `state.set(previous => next)` | `count.set(n => n + 1)`              | 基于已有当前值更新；已有 Promise 由基础层接续，回调接收完成值                                     |
| `val(source)`                 | `val(count)`                         | 读取当前值，递归解除 StateView、PromiseLike 包装；等待和失败由 Solid 传播，真正完成的空值仍是空值 |
| `val(source, fallback)`       | `val(count, 0)`                      | 最终结果为 `null` 或 `undefined` 时使用 fallback；fallback 可以是函数                             |
| `state.read()`                | `count.read()`                       | 读取完成结果；不继续解除结果内的 StateView，业务通常使用 `val()`                                  |

## 创建关联状态或独立状态

需要关联，就把读取来源的计算交给 State；需要独立，优先提前取得当前值，再把这个值交给 State，让新状态的计算没有可追踪的来源。

```ts
const count = createState(1)

// 在计算中读取 count，建立依赖。
const linked = createState(() => val(count) * 2)

// 先取得当前值，新 State 的创建过程不再读取 count。
const initial = val(count)
const independent = createState(initial * 2)
```

两者初始值都是 2。以后 count 改为 3，Solid 提交更新后，linked 变为 6，independent 仍为 2。independent 可以通过自己的 `.set()` 独立修改。

独立状态从创建时就没有建立对 count 的计算依赖，不需要先联动再断开。即使写成 `createState(() => initial * 2)`，计算读取的也只是已取得的值，不会因此关联 count；依赖来自计算中对响应式来源的读取，而不是函数包装本身。

这里的“先读取”是指在新 State 的计算函数之外读取。如果 `const initial = val(count)` 位于另一个响应式计算中，它仍会建立那个外层计算对 count 的依赖，外层重算也可能重新创建 independent；不能把“写在 createState 外面”等同于“处于所有追踪范围之外”。

也可以用原生 `untrack` 显式禁止这次读取收集依赖，作为逃生写法：

```ts
import { untrack } from '@/foundation/reactivity'

const independent = createState(untrack(() => val(count) * 2))
```

`untrack` 先执行函数，createState 收到的是它返回的值。它在当前读取时就不建立依赖，不需要创建后再解除关联。这里的函数传给 untrack，没有作为 State 的计算函数保留下来。

这段实现虽然短，但独立关系要通过理解 untrack 才能看清，因此优先使用前面的提前取值写法；untrack 只作为确有需要时的逃生口。它只控制依赖收集，异步等待和错误仍遵循 Solid 的机制。

## 函数作为数据

函数作为数据时，通过外层函数区分初始化／更新操作与函数值：

```ts
const handler = createState(() => onClick)
handler.set(() => anotherOnClick)
```

`val(fn)` 保留普通函数，不调用它。对象状态的通知来自 `.set()`，直接修改对象内部字段不会自动触发这套 State 的通知。

# 派生与转换

| API                          | 用法                                    | 当前行为                                                             |
| ---------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `state.map(mapper)`          | `count.map(n => n * 2)`                 | 返回 StateView，内部用 Solid memo 缓存结果                           |
| `.map()` 返回 StateView      | `selected.map(id => states[id])`        | 跟随所返回视图的当前值                                               |
| `stateView(value)`           | `stateView(10)`                         | 普通值直接转换成只读 StateView；函数输入由原生计算跟踪依赖并等待异步 |
| `stateView(view)`            | `stateView(count)`                      | 返回原有视图                                                         |
| `stateView(source, mapper)`  | `stateView(count, n => n * 2)`          | 转换来源后派生                                                       |
| `stateView(source, { map })` | `stateView(count, { map: n => n * 2 })` | 上一行的 options 写法                                                |
| `mapSource(source, mapper)`  | `mapSource(count, n => n * 2)`          | 执行 `stateView(source).map(mapper)`                                 |
| `derive(source, mapper)`     | `derive(count, n => n * 2)`             | 当前调用 mapSource，行为相同                                         |
| `derive(source)`             | `derive(count)`                         | 原样返回 source，不建立新计算                                        |
| `snapshot(tree)`             | `snapshot({ count, values: [count] })`  | 递归读取对象、数组中的 StateView，返回当前快照；不等待 Promise       |

函数来源的结果类型使用 `Awaited<T>`；需要把函数本身作为数据时，写成 `stateView(() => handler)`，返回的 handler 不会再次执行。

已有 State 时，直接使用 `.map()`：

```ts
const count = createState(1)
const doubled = count.map((n) => n * 2)
createEffect(doubled, (value) => console.log(value))
```

派生视图属于创建时的响应式作用域。派生结果相等时，不重复通知消费者动作。

当前 `derive()` 不会自动解包数组中的来源。这与 Effect 的来源数组契约不同：

```ts
const price = createState(10)
const quantity = createState(2)
const total = derive(
  [price, quantity],
  ([price, quantity]) => val(price) * val(quantity),
)
```

# 同步与异步使用同一读取链

假设 `request` 是已经创建好的 `Promise<number>`。

| 用法                                           | 行为                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `createState(request)`                         | 返回 `State<number>`，`.read()` 和 `val()` 读取完成值              |
| `createState(outsideState)`、`createState(outsideView)` | 返回内容值的可写 State，持续跟随上游，无需先调用 val |
| `createState(() => outsideState)`              | 计算可直接返回来源，由基础层读取内容并建立依赖 |
| `createState(() => loadItem(val(selectedId)))` | 原生计算跟随依赖，等待本次请求；旧请求不会覆盖新的来源             |
| `state.set(request)`                           | 替换来源，由结果计算等待；后续相对更新由基础层接续                 |
| `stateView(request)`、`val(request)`           | 默认 pending/失败进入 Solid 机制，不附加 undefined 或吞错          |
| `val(request, 0)`                              | 等待和失败交给 UI 边界，只有完成后的 null/undefined 使用 0         |
| `selected.map(id => loadItem(id))`             | mapper 的 Promise 由 Solid 等待，输出完成值，后继 map 也接收完成值 |

`createState<T>` 接受完整来源，包括普通值、PromiseLike、State、StateView 以及返回这些来源的计算函数，结果使用递归展开后的 `Val<T>`；`equals`、`loadingValue` 和相对更新的 previous 均针对内容值类型。Promise 完成后得到的 StateView 也会继续跟随其变化。直接传入 StateView 或计算来源时，下游可独立写入而不回写上游，后续上游变化继续驱动下游；无需在业务层用 Effect 搬运值。

相对更新要求来源已有当前值：已有 Promise 由基础层接续，previous 接收完成值；计算来源尚无初值时不预存更新命令。依赖初值的 UI 在 Loading 内读取，完成后提供更新交互，无需业务 await；Loading 不替任意命令排队。lazy 计算在首次读取后建立当前值。`options` 支持 name、equals、lazy、loadingValue、unobserved、ownedWrite；ownedWrite 仅在明确需要计算域写入时显式使用，默认不启用。如果要把 StateView 对象本身作为数据保存，应显式放入普通对象字段，例如 `createState({ reference: outsideState })`。

val 的默认函数仅在最终完成空值时执行，返回稳定 Promise 时仍由 Solid 等待。stateView 的选项只提供 map；等待和失败展示由 Loading、Errored 负责。同一个 Promise 的转换视图按身份缓存，首消费者释放不会终止后续消费者。不要在响应式读取中每次创建新 Promise 再交给 val，包括默认函数每次返回新 Promise；需要异步计算时用 createState 的计算来源或 map 建立计算节点。

```tsx
const selectedId = createState('A')
const item = selectedId.map(id => loadItem(id))
const title = item.map(item => item.title)

<Errored fallback={error => <p>失败：{String(error())}</p>}>
  <Loading fallback={<p>读取中</p>}>
    <h2>{val(title)}</h2>
  </Loading>
</Errored>
```

`Loading`、`Errored` 从包根或 Foundation 导入，直接对应 Solid 2 原生边界；异步完成后继续渲染，错误由最近的 Errored 展示。后续请求等待时，Loading 遵循原生语义，可能保留已显示内容，不等同于每次都强制显示 fallback。

# 响应式动作与清理

| API                             | 用法                                                                | 当前行为                                            |
| ------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| `createEffect(source, action)`  | `createEffect(count, n => update(n))`                               | 自动读取单个来源，再执行动作                        |
| `createEffect(sources, action)` | `createEffect([price, quantity], ([p, q]) => update(p, q))`         | 自动读取每项来源，保留位置关系                      |
| `createEffect(compute, action)` | `createEffect(() => val(count) * 2, n => update(n))`                | 第一阶段计算并跟踪依赖，第二阶段执行动作            |
| 异步计算形式                    | `createEffect(() => loadItem(val(selectedId)), item => show(item))` | 计算函数直接交给 Solid，可进入原生异步计算路径      |
| 动作返回清理函数                | `createEffect(source, value => subscribe(value))`                   | subscribe 若返回清理函数，由 Solid 管理本轮资源释放 |
| `onCleanup(cleanup)`            | `onCleanup(() => connection.close())`                               | 在当前响应式作用域登记清理                          |

Effect 使用优先级：单来源 → 多来源数组 → 计算函数。不要为了形式上采用单来源而制造无意义的派生状态。

第一阶段读取和跟踪依赖，第二阶段执行动作；动作中的读取不隐式增加依赖。动作返回的清理函数由 Solid 生命周期管理。

# 辅助与内部能力

| API                            | 入口与用法                                                   | 当前状态                                      |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------- |
| `isState(value)`               | 包根／Foundation                                             | 判断可写 State                                |
| `isStateView(value)`           | 包根／Foundation                                             | 判断 StateView，State 也属于 StateView        |
| `isStateViewable(value)`       | 包根／Foundation                                             | 判断 StateView 或 PromiseLike，不包含普通值   |
| `stateBrand`、`stateViewBrand` | 包根／Foundation                                             | 身份标记，业务通常不需要操作                  |
| `createMemo`                   | `@/foundation/reactivity`：`createMemo(() => computation())` | 内部导出，未由包根公开；`.map()` 已在内部使用 |
| `createRenderEffect`           | Foundation 内部入口，参数形式与 createEffect 相同            | DOM 提交使用，未由包根公开                    |
| `createStateWithPrev()`        | 包根／Hooks                                                  | 已导出但尚未实现，调用会抛错                  |

| 类型                     | 表达什么                                            |
| ------------------------ | --------------------------------------------------- |
| `State<T>`               | 可写状态                                            |
| `StateView<T>`           | 可读、可派生视图                                    |
| `Source<T>`              | 普通值或来源；Source<number> 可接收 Promise<number> |
| `StateViewable<T>`       | StateView 或允许的 PromiseLike 来源                 |
| `MayArraySource<T>`      | 单值或列表来源，列表中的项目也可以独立为来源        |
| `Val<S>`                 | 对实际输入 S 递归解包后的读取类型                   |
| `Snapshot<T>`            | 树形快照结果类型，从 Hooks 导出                     |
| `StateViewOptions<V, U>` | 转换后的映射配置 `{ map }`                          |

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

## 组件树上下文

UIKit 的 `createContext`、`useContext` 与 `Context` 类型直接使用 Solid 2 契约。Context 自身就是提供组件：

```tsx
interface Item {
  name: string
}
const CurrentItem = createContext<Item>()

function ItemPanel(props: { item: Item }) {
  return (
    <CurrentItem value={props.item}>
      <Details />
    </CurrentItem>
  )
}

// 在后代组件中读取最近提供者。
function Details() {
  const currentItem = useContext(CurrentItem)
  return <span>{currentItem.name}</span>
}
```

未设置默认值的 Context 在缺少提供者时抛错。useContext 必须在组件或响应式作用域中读取；无 owner 时即使设置了默认值也抛错。undefined 表示缺少提供值；领域数据的可选结果仍使用 undefined，不主动引入 null。

### KitContext 的应用根

宿主 App 直接提供的节点就是根，没有额外内部 Root。每个应用实例创建自己的节点：

```tsx
import { KitContextRoot, type KitContextNode } from '@edsolater/uikit'

function App() {
  const rootNode: KitContextNode = { isRoot: true }
  return (
    <KitContextRoot value={rootNode}>
      <Content />
    </KitContextRoot>
  )
}
```

普通 KitContext 初始化时连接当前父级并提供具名节点。useKitContext 读取最近或指定祖先的数据，遇根停止，未命中返回 undefined；未提供应用根时沿用原生 Context 错误，不自动创建根。
