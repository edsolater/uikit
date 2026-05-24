## Button 状态边界待收口

结论先写清楚：`Button` 可以保留自己的 `status manager`，但这个 `status manager` 是被动状态层，不是主动判断层。

```txt
Button
负责：接收状态、注册状态、输出状态对应的 DOM / class / a11y 表达

外部设施
负责：判断为什么进入 loading / disabled / 其他业务状态
```

---

## 当前共识

- `status manager` 可以留在 `Button` 本体里。
- `status manager` 的职责是状态挂载点、状态汇合点、状态输出点。
- `status manager` 不负责判断状态是否成立。
- `validator`、`credibility`、`query database` 属于外部判断设施。
- 外部判断设施当前可以暂时 colocate 在 `Button` 文件夹里。
- colocate 只是目录策略，不代表这些设施属于 `Button` 本体。

---

## 当前口径的问题

- 旧 todo 把 `Button` 写成“只显示”，容易让人误读成 `Button` 内部不该有状态层。
- 旧 todo 没有把“被动状态层”和“主动判断层”拆开。
- 旧实现里 `validator` 被 `Button` 直接装配，边界上看起来像是 `Button` 的内建能力。

---

## 新口径

```txt
Button 可以有 status manager。
status manager 只负责承载状态，不负责裁决状态。
validator / credibility / query database 只负责产出状态，不属于 Button 本体。
```

更细一点：

```txt
Button 内部交互态：hover / active / focus-visible
Button 外部业务态：loading / disabled / 以后其他业务状态
Button status manager：统一接住这些状态，再翻译成表现
```

---

## 推荐心智模型

```txt
Button = action control + passive status receiver
```

不是：

```txt
Button = validator + workflow owner + state judge
```

也就是说：

- Button 不是流程编排者。
- Button 不是判断器。
- Button 是状态表达器。

---

## 状态来源怎么分

### 交互状态

- `hover`
- `active`
- `focus-visible`

这些状态来自控件本身的交互反馈，属于 `Button` 天然可感知的状态。

### 业务状态

- `loading`
- `disabled`
- 未来如果有别的业务状态，也应该先由外部设施产出，再注入 `Button`

这些状态不是 `Button` 自己判断出来的结论。

### 默认态

- `idle` 可以作为概念默认态保留。
- `idle` 表示当前没有特殊业务状态。
- `idle` 不一定需要作为显式 props 或显式注入状态存在。

---

## 下一步要改什么

- 在 `spec` 里明确 `status manager` 是被动状态层。
- 在 `spec` 里明确 `validator / credibility / query database` 是外部判断设施。
- 让 `Button` 的 API 口径支持“外部注入状态”，而不是“内部判断状态”。
- 已决定收口为单一 `status` 注入入口，不再同时保留 `loading` / `disabled` 便捷 props。

---

## 暂时不做的事

- 暂时不在 todo 里展开具体实现代码。
- 暂时不决定 `credibility` / `query database` 的最终目录落点。
- 暂时不把 `success` / `error` 一类流程态并入 `Button` 核心状态集。

---

## 定稿句

```txt
Button 可以有自己的 status manager。
但 Button 不应该有自己的 validator。
status manager 是被动状态层。
validator / credibility / query database 是外部判断设施。
```

