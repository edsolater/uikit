# 条件规则

## 用途

这个文件定义 TypeScript 和 JavaScript 代码里的条件语句写法。

它不负责函数抽取、类型归属、组件 props、CSS 条件查询或 Solid 状态模型。

## 核心规则

条件语句优先服务可读性。

`if`、`else if`、`else` 不只是运行路径控制，也是在向读者展示当前逻辑世界里有哪些情况。

如果显式写出每个分支能让环境信息更完整，就应优先写成清楚的分支枚举，而不是为了减少一行代码把最后一个分支压进裸 `else`。

## 显式枚举

当一个值有少量明确模式时，允许显式枚举所有模式。

推荐：

```ts
if (mode === 'signal') {
  return createSignalState()
} else if (mode === 'store') {
  return createStoreState()
} else {
  throw new Error(`Unsupported state mode: ${mode}`)
}
```

这里的 `else` 不是为了吞掉未知错误，也不是为了兼容额外模式。

它的职责是让读者看到：

- 已处理 `signal`
- 已处理 `store`
- 其他情况在当前类型语义下不应出现

这种写法比裸 `else` 更清楚，因为裸 `else` 无法在语法层直接显示“这里处理的是 store”。

## 不可达分支

不可达分支可以用于收束枚举结构。

允许的前提是：

- 前面的分支已经完整枚举当前语义。
- 不可达分支只作为阅读上的结构收尾。
- 不可达分支不改变正常运行语义。
- 不可达分支不掩盖调用方错误。

这种不可达分支不是防御性兜底。它不是为了让系统在错误输入下继续运行，而是为了让条件结构在阅读上完整。

## 防御性兜底

禁止用条件兜底掩盖本应暴露的错误。

不推荐：

```ts
if (config.apiUrl) {
  return config.apiUrl
}

return ''
```

这里的空字符串会掩盖必需配置缺失。

如果一个值在当前边界必须存在，就直接使用它；缺失时应暴露错误，而不是补一个默认值让流程继续。

## 裸 else

裸 `else` 只适合读者能自然推出剩余情况的场景。

推荐：

```ts
if (isOpen) {
  closePanel()
} else {
  openPanel()
}
```

这里是明确的二元状态，`else` 的含义不会丢失。

不推荐：

```ts
if (mode === 'signal') {
  return createSignalState()
} else {
  return createStoreState()
}
```

这里虽然类型上可能只有两个模式，但裸 `else` 没有把 `store` 这个环境信息写出来。显式 `else if (mode === 'store')` 更容易读。

## 检查清单

- 条件分支是否把关键环境信息写清楚
- 少量明确模式是否优先显式枚举
- 不可达分支是否只是阅读结构收尾，而不是防御性兜底
- 裸 `else` 是否真的不会损失语义
- 条件兜底是否没有掩盖必需输入缺失
