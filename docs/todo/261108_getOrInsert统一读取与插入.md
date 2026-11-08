成文日期：2026-11-08。

状态：TODO，尚未实现。想法产生于 UIKit 的 Popover 配对代码，暂记录在本仓库；最终通用函数归 FNKit，本轮不修改 FNKit 或其他项目。

# 目的与调用方式

统一使用 `getOrInsert` 表达“已有项直接返回，缺项才求值并插入”。通过参数形态区分普通值和延迟计算，不要求调用者另选 `getOrInsertComputed`。

以下是目标 API，不是当前已提供的 FNKit 接口：

```ts
// 普通值：缺项时直接插入。
getOrInsert(map, key, value)

// 函数：缺项时才调用，插入其返回值。
getOrInsert(map, key, () => createValue())

// 要保存的值本身是函数：再包一层。
getOrInsert(map, key, () => handleClick)
```

函数参数一律表示延迟求值；只执行一层，返回值即使仍是函数也直接保存，不继续调用。

# 行为

```ts
// 伪代码：实现归 FNKit，UIKit 不另造一份。
function getOrInsert(map, key, fallback) {
  if (map.has(key)) return map.get(key)

  const value = typeof fallback === 'function'
    ? fallback()
    : fallback

  map.set(key, value)
  return value
}
```

- 同时支持 `Map` 与 `WeakMap`，保留各自的键约束和引用语义。
- 用 `has` 判断是否已有项；已有值即使是 `undefined`、`null`、`false` 或 `0`，也不重新创建或覆盖。
- 已有项不执行工厂；缺项时执行并保存，之后读取同一个值。

# 当前状态与后续接管

FNKit 当前公开函数名为 `mapGet`，只支持 `Map`；UIKit 此处现用原生 `WeakMap.getOrInsertComputed(id, createPopoverGroup)`，没有实现新的通用函数。

后续在 FNKit 实现 `getOrInsert`，同步公开出口、参考文档、类型和行为测试，再核对并迁移各项目的 `mapGet` 调用。现有函数值调用也须按“一层工厂”约定检查，不能仅机械替换名字。具体发布与跨项目迁移届时单独安排，不在本 TODO 中宣称已经完成。

届时 UIKit 的 Popover 两端可以直接使用：

```ts
const group = getOrInsert(popoverGroups, id, createPopoverGroup)
```

不恢复 `getPopoverGroup` 包装函数，也不为了复用工具把 `WeakMap` 改成 `Map`。
