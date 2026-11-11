成文日期：2026-11-08。

状态：2026-11-11 已在 FNKit 按集合类型实现，并用于 UIKit 的 Popover；跨项目 `mapGet` 调用迁移仍待安排。

# 读取与插入

FNKit 的 [getOrInsert](D:/mycode/fnkit/src/collection-get-or-insert.ts) 负责按集合类型分派。同一文件内的 Object、Array、Map／WeakMap、Set／WeakSet、Iterator 函数分别承担具体操作。

原生集合通过 `hasKey` 判断已有项，缺项才计算并写回。Object 使用属性键，Array 使用数字下标，Map／WeakMap 使用原生 key，Set／WeakSet 以成员自身为 key；数字 Map 键不采用 `get` 的位置路由。

```ts
getOrInsert(map, key, value)
getOrInsert(map, key, () => createValue())
getOrInsert(map, key, () => ({ result: () => 3 })) // 缺项时递归求得 3。
```

已有 `undefined`、`null`、`false`、`0` 或函数值原样保留；只有缺项时才按 FNKit 的 `result(fallback)` 递归求终值。终值须符合目标集合的值类型。

Set／WeakSet 缺项时以 `add(value)` 插入，不校验 key 与 value 是否相等。WeakSet 的键与终值必须符合原生弱引用成员类型。

Iterator／Iterable 按数字 index 处理，返回新的惰性生成器，不向原来源写入。创建时不读取源，也不计算 fallback；消费时逐项保留原始产出，不解包 Entry。源长度不足时，以 `undefined` 补足前面的槽位，消费到目标位置才计算 fallback。已有目标项即使是 `undefined`，也不执行 fallback。

```ts
const values = getOrInsert([1].values(), 3, () => 9)
// 此时尚未消费原来源。
Array.from(values) // [1, undefined, undefined, 9]
```

原生集合返回成员值，迭代来源返回生成器；公开泛型分别表达这两类结果，并约束 fallback 的递归终值。该工具的 Iterator 按位置处理，不修改其他 Collection 方法已有的 Entry 键值规则。

UIKit 的 Popover 两端使用：

```ts
const group = getOrInsert(popoverGroups, id, createPopoverGroup)
```

这里保留 `WeakMap`，不增加 `getPopoverGroup` 包装函数。

# 后续迁移

旧 `mapGet` 只支持 `Map`。跨项目调用尚未迁移，具体发布与迁移另行安排。
