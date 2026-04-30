# 组件规则

## 用途

这个文件定义 SolidJS 组件、组件内本地能力、外部函数之间的职责边界。

目标不是把代码拆得更碎，而是让一个读者能稳定地看懂：

- 组件从哪里接收输入
- 哪些能力在组件内创建
- 哪些动作交给外部普通函数执行
- 哪些上下文是真正从外部使用而来

## 核心规则

组件负责组合结构，不负责把一整套业务能力摊开写在渲染体里。

在 SolidJS 里，组件函数只建立一次响应式图。不要继续按旧渲染心智写“每次执行都重新补一遍”的代码。

组件里允许直接创建本地 signal、effect 和事件处理器，但这些能力一旦有稳定语义，就应收成 `create*` 函数。`use*` 只留给“使用一个已经存在的外部上下文”的场景。

这里的“稳定语义”不是指代码行数多，也不是指内部用了几个 signal。

判断顺序是：

1. 这组状态、effect、事件是否总是围绕同一个目标一起出现。
2. 调用者是否可以用一个短名字说清这组能力，例如“创建图表画布能力”。
3. 这组能力的输入输出是否能形成一个清楚接口，而不是散落在组件局部变量里互相读取。

三个问题都成立，就收成 `create*`。只有第三点不成立，或者能力还只是当前组件里的两三行局部表达，才继续留在组件内。

## 组件输入

所有 component 必须接受且只接受一个标准 `props` 参数。

不要在函数参数位置直接解构 `props`。参数解构会把输入定义和局部使用压成一步，削弱数据流可读性。

推荐阅读顺序应稳定成立：

1. 先看 component 接收什么 `props`
2. 再看 component 从 `props` 读取了什么值
3. 再看这些值如何驱动本地能力、事件和结构

推荐：

```tsx
type DashboardChartProps = {
  closeValues: number[]
  chartColor: string
}

export function DashboardChart(props: DashboardChartProps): JSX.Element {
  const chartCanvas = createChartCanvas(() => props.closeValues)

  return <canvas ref={chartCanvas.setCanvas} />
}
```

不推荐：

```tsx
export function DashboardChart({ closeValues, chartColor }: DashboardChartProps): JSX.Element {
  return <canvas />
}
```

字段很少时可以直接使用 `props.xxx`。只有当对象层级特别深，连续访问已经明显损伤可读性时，才允许就近提取局部变量。

## 创建与使用

`create*` 表示创建一个新的本地能力。

例如：

- `createFlag`
- `createTaskScheduler`
- `createChartCanvas`
- `createMLResponsePoints`

这类函数可以创建 signal、effect、事件处理器、局部队列或本地控制状态。它们不是在使用外部上下文，而是在当前作用域里建立一套新能力。

`use*` 表示使用一个已经存在的外部上下文，并且调用时应当能说清“正在使用谁”。

已有上下文必须满足一个具体条件：不调用当前函数，这个上下文也已经由上层 provider、router、store 或外部对象建立好了。当前函数只是读取或消费它。

例如 Solid Router 的：

- `useLocation`
- `useNavigate`

它们成立，是因为组件已经处在 Router 上下文里，函数只是读取这份已有上下文。

不要写：

- `useFlag`
- `useTaskScheduler`
- `useChartCanvas`

这些名字会暗示它们在使用某个现成上下文，但实际是在创建本地能力，应改成 `create*`。

如果函数必须自己创建 signal、注册 effect、维护队列、保存 DOM 节点或组织事件处理器，它默认就是 `create*`。除非它的主要职责确实是读取已有上下文，否则不要用 `use*`。

## 能力目录

`hooks` 是前端里稳定的能力目录名，不等于文件必须以 `use` 开头。

目录可以叫 `hooks`，文件和函数仍应按语义命名：

- 创建本地能力：`createFlag.ts`
- 使用外部上下文：`useRouteContext.ts`
- 纯工具函数：不要放进 `hooks`

文件名表达具体能力，目录名表达能力类别。不要因为目录叫 `hooks`，就把所有函数都机械命名成 `use*`。

## 落点规则

能力落点按复用范围决定。

- 只服务当前组件，并且强绑定当前页面语义，就写在当前文件里。
- 被同一业务目录下多个组件共享，就提取到该业务目录。
- 不依赖具体业务语义，可以跨业务复用，就放进 `src/base/hooks/`。

不要为了“看起来更整齐”先建文件。文件拆分表达的是复用边界和职责边界，不是框架 API 的使用痕迹。

## 节点规则

判断一个能力是否应该独立，不看它内部有几个动作，而看它在业务上是不是一个稳定节点。

例如 chart canvas 的绘图、尺寸变化重绘、hover 点位同步，虽然动作不同，但都服务同一个图表运行节点，并共享同一组选项。它们可以收在一个 `createChartCanvas` 里，而不是拆成多个总是成对出现的小壳。

同一节点内部可以有多个 `createEffect`，每个 effect 只处理一种副作用。只有当业务节点本身已经不同，才拆成多个能力。

“同一个节点”可以用调用点来判断：

- 如果两个能力总是接收同一份 options。
- 如果两个能力总是在同一个组件里前后调用。
- 如果少调用其中一个，另一个也失去完整意义。

这通常说明它们不是两个平级能力，而是一个能力内部的两段工作。

相反，如果两个能力可以被不同组件分别使用，输入输出也互不依赖，就应拆开。

## 函数边界

真正执行核心动作的函数应优先写成普通函数，并通过参数表达输入边界。

Solid 能力层负责连接 signal、DOM ref、生命周期和事件；普通函数负责执行算法或一次性操作。普通函数不应感知组件生命周期，也不应接收 setter、accessor、ref 容器这类框架边界对象，除非它的职责本来就是处理这类对象。

推荐：

```ts
function drawChartContent(options: DrawChartContentOptions): PointLayoutInfo[] {
  // 只根据参数执行一次绘图
}
```

不推荐：

```ts
function drawChartContent(): void {
  // 直接抓外部 signal、setter 和 DOM 局部变量
}
```

## Component Context

component context 是组件领域内部的局域网，不是应用级全局状态。
它让同一个组件领域里的业务级组件和业务级 hook 共享已经成立的领域背景，但不把这些内容暴露给外层业务。

component context 默认保持一层字段结构，不为了表达分类而制造多层对象。
字段归属通过就近注释表达，领域标签使用中文括号写在字段注释开头，例如（环境信息）、（DOM 信息）、（设置信息）、（数据信息）、（UI 信息）。
这条规则不随项目规模改变；规模变大时也优先保持一层字段和清晰注释，而不是把领域分类做成运行时层级。

component context 不是基础抽象，而是 component 领域内的一种协作模式。
只有当一个 component 已经需要像公司一样运营时，才启用 component context：
它不再只是整体负责一个职能，而是内部出现了多个明确职能，例如 DOM 绑定、绘图、hover 交互、tooltip 展示、局部数据传递等。
如果 component 仍然只是一个单一职能组件，就继续用 props、局部 state 和显式参数，不要提前创建 context。

领域内业务级组件和业务级 hook 可以按需读取 component context。
base hook、通用 hook、纯工具函数和底层算法函数不能读取 component context。
DOM ref 的写入口这类绑定动作不应随手放进公共 context；如果只有某个内部组件负责绑定，就应通过明确参数交给那个组件。

component context 依赖领域内的君子协定，因此字段注释必须写清楚职责边界。
不再额外引入通信抽象或字符串标识：TypeScript 的字段引用和 setter 引用已经能追踪谁读取、谁写入。
例如搜索 `setPointLayouts` 就能看到谁是写入者，搜索 `pointLayouts` 就能看到谁是消费者。

推荐：

```ts
type ChartContextValue = {
  /** （环境信息）当前图表在外部列表里的位置。 */
  chartIndex: MayState<number>
  /** （DOM 信息）chart 使用的 canvas 节点。 */
  canvas: State<HTMLCanvasElement | undefined>
  /** （设置信息）点位半径配置，由绘图和 hover 能力共同消费。 */
  dotSize: MayState<number>
  /** （数据信息）外部输入的 series 数据。 */
  seriesList: MayState<ChartSeries[]>
  /** （UI 信息）绘图能力写入点位布局，hover 检测能力读取。 */
  pointLayouts: State<PointLayoutInfo[]>
  /** （UI 信息）pointLayouts 的写入口，只应由绘图能力使用。 */
  setPointLayouts: SignalStateSetter<PointLayoutInfo[]>
}
```

不推荐：

```ts
type ChartContextValue = {
  env: ChartEnv
  settings: ChartSettings
  data: ChartData
  ui: ChartUiState
}
```

也不推荐：

```ts
function drawChartContent(): PointLayoutInfo[] {
  const chartContext = useChartContext()
  // 底层绘图函数直接读取 component context
}
```

判断一个值放在哪里时，先分清它的语义：

- 描述组件实例活在哪里，字段注释标为（环境信息）。
- 描述浏览器 DOM 对象，字段注释标为（DOM 信息）。
- 描述当前实例怎么运行，字段注释标为（设置信息）。
- 描述外部输入或内部数据，字段注释标为（数据信息）。
- 描述内部两个或多个主体之间的私有数据交接，字段注释标为（UI 信息）或对应领域信息。
- 如果是底层算法的一次性输入，继续用显式参数。

## 回调规则

回调的目的，是把节点之间的依赖关系说清楚。

- 父组件传进来的事件属性通常用 `on*`
- 当前组件内部处理动作通常用 `handle*`
- 状态写回动作通常用 `set*` 或 `update*`

不要把所有函数都叫 `on*`。`on*` 更像外部事件入口，不适合装内部处理动作或状态写回。

## 命名规则

- `Props` type 名必须和 component 主体一致，并以 `Props` 结尾。
- component 的参数名统一使用 `props`。
- 本地创建能力使用 `create*`。
- 使用已有上下文才使用 `use*`。
- 事件处理函数使用 `handle*`。
- 不要用 `p`、`input`、`payload`、`options` 代替组件参数 `props`。

## 检查清单

- 组件签名是否只接收一个 `props`
- 是否避免了参数解构
- 本地能力是否用 `create*` 表达
- `use*` 是否只用于已有外部上下文
- 同一业务节点是否没有被拆成多个总是成对出现的小能力
- 核心动作是否通过普通函数和显式参数表达
- 事件、写回、外部回调的命名是否区分清楚
