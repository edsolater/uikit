本文记录 fnkit 现有 Promise 专用对象代理的命名和公开说明问题。当前实现位于 `D:\mycode\fnkit\src\object-proxy.ts`；本文不授权立即修改 fnkit。

# 当前能力

现有 `ObjectProxy<Value>` 只由 `Promise<Value>` 创建。它允许调用方在 Promise 完成以前建立属性读取和方法调用链：

```ts
const controller = toObjectProxy(controllerPromise)

const score = controller.game.score
const result = controller.start()

await score
await result
```

任意属性读取、函数调用和调用结果都会继续返回 `ObjectProxy`。代理通过 `then` 暴露 Promise 的完成结果，因此任意层级都可以直接 `await`。

---

# 当前问题

`ObjectProxy` 没有在名称中表达 Promise 边界。只看名称，读者容易把它理解成适用于普通同步对象的通用代理；只有阅读函数签名或实现，才能发现它固定建立在 Promise 上。

当前源码注释解释了 `get`、`apply`、`then` 和内部 Promise，但没有使用 JSDoc `@example` 展示最主要的调用形态。fnkit 的 `reference.md` 又说明具体示例以源码 JSDoc 为准，因此读者缺少能够直接形成想象的公开示例。

---

# 候选调整

当前优先候选名为：

```ts
PromiseObjectProxy<Value>
toPromiseObjectProxy(promise)
```

候选文件名为：

```text
promise-object-proxy.ts
```

`PromiseObjectProxy` 同时表达 Promise 来源、对象式递归访问和 Proxy 机制，比 `ObjectProxy` 更接近当前真实能力。最终名称仍需结合完整公开 API 一起裁决。

---

# 待裁决

- 最终采用 `PromiseObjectProxy`、`PromiseValueProxy` 还是其他能够表达 Promise 边界的名称。
- 类型、创建函数、品牌 symbol、反向 Promise 转换函数和文件是否整组改名。
- 是否保留旧名称兼容入口；当前没有兼容策略结论。
- JSDoc `@example` 应覆盖哪些最小场景，包括属性递归、方法调用、任意层级 `await` 和错误传播。
- Promise 专用实现是否复用通用递归代理结构；命名修正不依赖这项实现重构。

