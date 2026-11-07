成文日期：2026-11-07。

状态：后续 TODO，尚未实现。目标是让 PromiseResultProxy 兼容完整 Promise 协议；本轮不修改 FNKit 或 UIKit 源码。

# 当前协议：PromiseLike 与递归代理

FNKit 的 [PromiseResultProxy 实现](../../../fnkit/src/structure-promise-result-proxy.ts) 通过 [公开出口](../../../fnkit/src/index.ts) 导出。当前类型表达为 PromiseLike 与递归属性、调用代理的组合：

```ts
// 当前类型的简化示意。
type PromiseResultProxy<T> = PromiseLike<T> & 递归访问与调用协议<T>
```

运行时专门提供 `then`，因此可以 `await`；其他字段默认从真实结果对象读取。这不等于已经完整实现 Promise 的 `catch`、`finally` 等协议。已有 `toPromiseFromPromiseResultProxy` 可以提取内部原生 Promise，但不能据此声称代理自身已经兼容完整 Promise。

# 目标：保留代理访问，同时满足 Promise 协议

以下是目标效果，不是当前已成立的调用：

```ts
const value = { profile: { name: 'Ada' } }
const proxy = toPromiseResultProxy(Promise.resolve(value))

await proxy.profile.name // 保留已有的深层访问能力。
await proxy              // 取得完整真实结果。

const promise: Promise<typeof value> = proxy
proxy.catch(处理失败).finally(收尾)
```

目标要求公开类型与实际运行能力一致，不能只将 `PromiseLike<T>` 改写成 `Promise<T>`，也不能通过 `as Promise<T>` 掩盖运行时缺口。

属性访问、方法调用、接收者绑定和异步结果继续代理是已有能力，需要保留；本 TODO 不重新实现一套多层代理。

# 后续需要明确与验证

- 核对 `then`、`catch`、`finally` 的行为、异常传播与链式返回类型，覆盖成功、拒绝和回调抛错。
- 明确代理与原生 Promise 的运行时关系，以及 Promise 协议成员与真实结果对象同名成员的访问规则。
- 同时验证等待完整值、递归属性访问和方法调用，不以“能 await”代替完整协议检查。

此增强属于 FNKit 的通用代理职责，暂记录在 UIKit 的 TODO 中，后续再单独实施。惰性取值是另一项增强，不作为本篇前置条件。

[Task／TaskResult 异步操作](261107_Task与TaskResult异步操作.md) 将复用代理设施；它的任务执行和取消语义不由本篇重复定义。
