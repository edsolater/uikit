成文日期：2026-11-07。

状态：后续 TODO，尚未实现。本轮继续将 `withDom` 迁移为 `domProxy`，明确接受下述异步时序缺口，不以完成 Task 机制作为迁移前提。

# 当前问题：取得元素不等于可以执行操作

旧 Tooltip 在宿主接入回调中创建附属浮层，再由焦点、悬停等事件请求显示：

```ts
pluginCore({ withDom }) {
  withDom(el => {
    const surface = 创建浮层并登记到显示控制器()
    createPivStructure(el).insertAfter(surface)
  })

  addProps({ on: { focusin() { 显示控制器.showPopover() } } })
}
```

原有立即聚焦测试通过，只证明当时执行顺序恰好满足显示条件，不能证明极慢 DOM 获取也能正常工作。它隐含了“收到显示请求时，浮层已经可操作”的假设。

迁移后，构建期可以先创建浮层，结构工具等待 `domProxy` 后再插入。这个顺序更明确地暴露了原有假设：

```ts
const surface = 创建浮层并登记到显示控制器()
createPivStructure(domProxy).insertAfter(surface)

// 插入尚未完成，用户已经聚焦宿主。
显示控制器.showPopover() // 对未接入文档的浮层操作，可能报错。
```

需要区分三个时刻：

```text
请求操作 → 取得目标元素 → 元素满足该操作条件 → 执行并产生结果
```

元素已创建、`domRef` 已收到元素，并不意味着它已接入文档。像 `showPopover()` 这样的原生操作还要求目标处于可操作状态；仅等待宿主的 `domProxy` 也不自动保证附属浮层已经插入。

类似时序还包括：作用域已经清理，但先前等待 DOM 的操作稍后才开始执行。当前不增加延时、重试、任务队列或逐消费者的补偿来填满这些缺口。

# 后续目标：用 Task 与 TaskResult 表达一次异步操作

Task 是可调用的函数。每次调用立即返回一份 TaskResult；一次执行拥有自己的完成结果与取消入口。原生 `focusin` 是触发事件，事件处理器调用的显示或聚焦操作才是 Task。

以下是目标调用面的伪代码，不是当前可导入的 API：

```ts
const taskResult = showTooltipTask()

taskResult.result // PromiseResultProxy<boolean>：这次任务最终是否成功。
taskResult.abort() // 请求取消这一次执行。

const succeeded = await taskResult.result
```

```ts
addProps({
  on: {
    focusin() {
      showTooltipTask() // 发起操作即可，不要求事件处理器等待。
    },
  },
})
```

TaskResult 的异步对象访问与结果传播复用 FNKit 已有的 `PromiseResultProxy`。成功结果是 boolean，不是“Promise 已完成”或“已拿到 DOM”；必须以这次操作实际成功为依据。

TaskResult 必须在任务进行期间就能用于取消。即使外层也经代理包装，也不能等操作完成、或者等到取得 DOM，才向调用者提供有效的 `abort` 入口。外层包装的具体类型留待实现前明确。

任务内部预期负责等待与有效性判断，而不是让每个调用者手工接线：

```text
调用 Task，立即取得 TaskResult
  → 等待目标满足操作条件
  → 确认这次任务仍然有效
  → 执行操作并提交结果
  → result 表达最终是否成功
```

“正在等待 DOM”是理解任务执行过程的阶段；当前没有决定公开进度、阶段字段或额外的状态 API。

# abort：能停止执行，也能阻止过期结果生效

```text
底层支持取消
  → 例如传递 AbortSignal，由 AbortController 请求实际中止。

底层不支持取消
  → 计算或等待可以继续。
  → 取消后的任务不能再把结果提交到当前状态，或继续发起尚未执行的界面操作。
```

这需要任务执行方在操作和结果提交处遵守取消状态。单纯不再等待 Promise，并不能阻止它继续运行；给 Promise 增加一个名为 `abort` 的方法，也不会自动取消底层执行。

取消不能撤销已经完成的副作用。例如浮层已经显示后再取消任务，是否需要关闭浮层属于该操作自己的语义，不能由通用 Task 机制假装已经回滚。

# 当前迁移与后续工作的边界

- 本轮移除 `withDom`，直接使用 `domProxy` 与已有结构、清理工具；Controller 继续在构建时完整返回。
- 慢 DOM、浮层尚未插入时的显示请求，以及清理后等待中的操作晚执行，均属于本 TODO 的已知未完成问题。相关代码通过 TODO 链接本文，不冒称行为已完整修复。
- 不实现 Task／TaskResult、通用 abort、结果失效控制或成功 boolean 的统一返回协议；不修改 FNKit。现有 `PromiseResultProxy` 是可复用设施，不表示 FNKit 已经提供本文的 Task 契约。
- 首次 DOM 身份固定、`if` 重建或换宿主尚未支持的既有妥协继续保留；本文不把它们改写成已完成能力。

# 后续实现前需要明确

1. 取消后 `result` 怎样结束；返回 false、拒绝或其他处理尚未裁决，不能留下永远等待的结果却声称契约完整。
2. 普通操作失败与异常怎样区分，哪些产生 false、哪些拒绝。
3. 各操作的就绪条件与提交点。例如 Tooltip 等待的是浮层可显示，而非仅取得宿主元素。
4. TaskResult 外层怎样复用代理，并保证取消入口不被正在等待的操作挡住。

后续验证至少覆盖慢目标就绪、等待期间取消、无法真正取消时阻止晚结果提交，以及不同执行之间互不误取消。此处记录后续方向，不要求当前迁移为了测试全通过而提前实现。
