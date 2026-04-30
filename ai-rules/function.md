# 函数规则

## 用途

这个文件定义 TypeScript 和 JavaScript 代码里函数应该如何抽取、放在哪里，以及什么内容适合抽成函数。

它不负责类型归属、组件 props、CSS 文件组织或 Solid 状态模型。

## 核心规则

抽函数是为了表达一个稳定动作，不是为了把当前文件变短。

函数应该回答一个清楚的问题：

- 它做什么
- 它需要什么输入
- 它返回什么结果
- 它不负责什么上下文

如果这些问题说不清，就不要急着抽函数。

## 适合抽函数

这些情况适合抽成函数：

- 一段逻辑有明确动作名。
- 调用点读起来像在执行一个完整步骤。
- 输入输出能通过参数和返回值说清。
- 这段逻辑能减少调用方对细节的关心。
- 这段逻辑承担纯计算、转换、筛选、格式化、组装、命中判断等明确动作。

推荐：

```ts
function createChartSeries(points: MLResponsePoint[], selectedKey: string): ChartSeries {
  return {
    seriesName: selectedKey,
    points: points.flatMap((point) => {
      // ...
    }),
    chartColor: defaultPointColor,
  }
}
```

## 不适合抽函数

这些情况不应抽成函数：

- 只是为了让当前文件少几行。
- 抽出后需要传入大量局部变量，调用点更难读。
- 函数名只能写成空泛的 `handleData`、`processItems`、`doStuff`。
- 函数内部依赖调用方的隐式上下文，但参数没有表达这些依赖。
- 抽出后仍然只服务一行简单表达，反而打断阅读。

不推荐：

```ts
function makeResult(a: A, b: B, c: C, d: D, e: E) {
  // 只是把组件局部上下文搬到另一个函数里
}
```

## 函数与文件

抽成函数不等于新建文件。

如果函数只服务当前文件主体，就放在当前文件里。当前文件就是它的归属边界。

只有当函数被多个平级主体共享，或者它本身已经成为一个可独立理解的领域能力时，才考虑新建文件。

推荐：

```ts
// Page.tsx
function collectAvailableKeys(points: MLResponsePoint[]): string[] {
  // 只服务当前页面
}
```

不推荐：

```txt
src/pages/ml-response/collectAvailableKeys.ts
```

如果这个函数仍然只被当前页面使用，新建文件只是制造跳转成本。

## Hook 与函数

Hook 抽取本质上仍然是函数抽取。

`create*` 能力、普通函数、组件内辅助函数的判断标准一致：先看它是否有明确职责和清楚输入输出，再决定是否独立。不要因为它内部使用了 Solid API，就把局部逻辑提前抽成 hook 文件。

函数独立的优先判断是职责，而不是框架痕迹。

允许独立：

- 这段逻辑有明确名字。
- 输入输出能形成清楚接口。
- 调用点读起来像在调用一个完整能力。

不应独立：

- 只是因为里面用了 signal、effect 或生命周期。
- 抽出后反而需要绕更多参数、setter、accessor 或局部上下文。

## 样式对象函数

样式对象可以抽成函数，但不等于要新建文件。

当动态 style 需要组合多个值、带单位、或需要集中表达 CSS 变量时，可以在当前组件文件里抽成局部函数。

推荐：

```tsx
const chartPanelStyle = () => ({
  '--chart-card-min-width': `${$(chartCardMinWidth)}px`,
  '--chart-card-height': `${$(chartCardHeight)}px`,
}) as JSX.CSSProperties
```

不推荐为了一个当前组件专用 style 函数新建文件。

## 检查清单

- 抽函数是否因为职责明确，而不是因为文件太长
- 函数名是否能准确描述动作
- 输入输出是否通过参数和返回值表达清楚
- 抽出后调用点是否更容易读
- 当前文件内函数是否足够，不要过早新建文件
- style 抽取是否只是当前组件局部函数，而不是额外文件
