# Style System 属性值贡献与聚合 Plan

> 状态：默认组合与 Value 输出规则已实施并通过全量验证，本轮独立复查通过。[Style System 语义节点与条件地址 Plan](StyleSystem语义节点与条件地址.md) 的 AST 编译链已有实现；本 Plan 不参与它的验收。

## 要解决的问题

多个独立声明可以向同一个 CSS property 贡献值的片段。它们直接重复声明该 property 的 Key，无须另设不输出的贡献 Key。例如同一地址的两条 `$boxShadow` 声明默认形成一个数组 Value，由 Value 输出逗号连接的 `box-shadow`；每条声明只知道自己的内容。

公开输入继续使用有序声明序列 `rules(path, [[key, content], ...])`，同一 Key 可以重复。同址同名至少两项默认按原顺序合成数组 Value；Key 对象可以用 `join` 改写该默认组合。Compiler 只负责按最终地址和属性名组织声明、调用一致的自定义规则或默认组合，不按属性名内置算法。

本 Plan 讨论的是 **CSS Property Value** 的组合，与现有 Variable Cluster 聚合多个 Variable 成员是不同需求。

## 语义边界

- 每个声明独立携带内容与 Condition。聚合按同名属性、同一 Target 与 State 输出地址分别进行，不把默认态的内容并入 hover 等其他 State 的聚合结果；Condition 仍由浏览器实时判断，不预先枚举 hover、focus 等所有组合。
- 聚合保留确定的贡献顺序；不默认交换或去重。`box-shadow: A, B` 与 `B, A`、`A, A` 与 `A` 不能无依据地视为等价。
- 默认组合是有序 Value 数组及逗号输出；它不声称每个 CSS 属性都接受逗号列表。需要数值运算、空格序列或其他语义时，Key 的 `join` 自行决定结果。

一个 `box-shadow` 行为例子（A、B、C 各表示一层合法阴影）：

```text
rules('.b', [[$boxShadow, A], [$boxShadow, B]])
rules(['.b', 'hover'], [[$boxShadow, C]])

输出 .b：box-shadow → A, B
输出 .b:hover：box-shadow → C
```

同地址阴影保留声明顺序和重复项；hover 有自己的地址。同样的默认逗号组合适用于其他重复 Key，CSS 值是否合法由浏览器判断。

## 本次需求实现合同

| 要求、材料与负责主体 | 验收信号与正式位置 | 实施前 | 实施后 |
| --- | --- | --- | --- |
| `rules(path, [[key, content], ...])` 保留有序重复声明；Compiler 按最终 Target header、规范化 State name 与属性名归组，不把原始语义父链或对象引用当作输出地址。 | 同名不同 Key 对象、不同 Target／State、交错路径的编译测试；`rule.ts`、编译器。 | 未满足 | 满足：定向单测覆盖同名对象、状态重排与目标隔离。 |
| 同址同名至少两项默认组合有序 `Value[]`，包括对象 Key 与字符串 Key；组内唯一显式 `join` 接管未设规则的 Key，多个不同显式规则报冲突。每个 Value 保留原内容身份和所属节点的解析映射，组合产物仍走普通内容链。 | 普通 Key、字符串 Key、自定义数值合并、同对象不同位置解析、显式与默认混用及多显式冲突反例；`key.ts`、编译器。 | 未满足 | 已实施并通过全量测试，独立复查通过。 |
| 组合结果位于组内最后声明位置；解析稳定后才收集，晚到节点、产物重入、改写和撤销会重算，不删除来源的依赖。 | 晚插入、依赖、重复、交错锚点、结果重入与撤销反例；解析器。 | 未满足 | 已实施并通过全量测试，独立复查通过。 |
| Value 对字符串、数字、布尔值及纯数据对象默认使用 `String`，`null`／`undefined` 不输出；数组递归读取并用逗号加空格连接，跳过空项。JSSContent 对象继续走现有 `parse`、`onActive`、`dependencies`、`toCSSString` 链；用户传入的 `toCSSString` 规则优先。 | `value([valueList(...), [0, false, undefined]])`、自定义规则、纯对象、空数组、循环和原对象双节点测试；`value.ts`、编译输出。 | 未满足 | 已实施并通过全量测试，独立复查通过。 |
| `valueList` 与 `valueSequence` 只装配 Value 的默认逗号或空格输出，不复制遍历和解析。现有消费者继续使用便捷入口。 | 四处生产调用、组合嵌套阴影和依赖测试；`pieces/contents/atom-creators/list.ts`。 | 未满足 | 已实施并通过全量测试，独立复查通过。 |
| 删除或替换登记句柄后从当前源账本重编译；真实浏览器读取组合值。先前无规则重复声明依赖浏览器回退的效果在本轮裁决下退出，测试应明确显示新结果。 | `compileCSS`、`cssRoot.mount`、浏览器计算与替换撤销反例。 | 未满足 | 已实施并通过全量测试，独立复查通过。 |

失败时抛错并保留 `cssRoot.mount()` 上次成功提交。本次不为其他 CSS 属性额外猜测专属语义，不增设贡献专用 Key 或声明入口。

## 与 AST Plan 的交接

AST Plan 已独立交付 `Rules → styleNodes → contentNodes → CSSString`：待解析节点保留 Target 与 State 地址，输出节点只含可输出内容。Compiler 在队列稳定时调用 Key 的 `join` 或默认数组组合，将结果接回同一解析链；输出阶段只组装已完成的声明，不承担属性专属决策。

本 Plan 不倒过来要求 AST Plan 实现聚合协议；AST 的正确性仍由其自身的节点、改写与现役行为验收判断。

## 实施落点与职责

| 文件 | 本次职责与相邻关系 |
| --- | --- |
| `key.ts` | Key 自身可选的 `join` 接收有序 `Value[]`；默认组合不依赖 Key 对象身份，唯一显式规则优先于默认，多个不同显式规则报冲突 |
| `value.ts`、`pieces/contents/atom-creators/list.ts` | Value 保留原内容、子项解析和可选 `toCSSString` 规则；默认按类型输出，两个列表 helper 仅装配 Value |
| `rule.ts` | 继续登记有序 Rules；声明序列保留重复 Key，未增加贡献专用入口 |
| `condition.ts`、`compiler/ast-controller.ts` | 共用最终 Target／State 地址身份；AST 查询与聚合不各自实现一套地址比较 |
| `pieces/keys/box-shadow.ts` | 作为普通 Key 使用默认组合，不判断各项阴影形状 |
| `variable-modification.ts` | 仅在同址重复的内部基础值、步骤与结果声明上显式取最后有效值，维持 Variable 原有赋值语义 |
| `compiler/style-nodes-to-content-nodes.ts` | 等待原队列稳定，按地址和属性名收集；保留输入来源，在末项生成结果节点并继续解析；来源变化或结果被删时重建 |
| `compiler/content-nodes-to-css-string.ts` | 提供惰性读取每项已解析内容的方法，最后仍按内容节点顺序生成 CSS 文本 |

各源节点的解析替代关系独立保存；Compiler 在相应 Value 上装配惰性读取，不把不同节点的 `WeakMap` 合成最后节点的一份，也不重新解析原内容。`join` 保留输入 Value 对象时，继续读取其来源位置的解析结果；改写 `content` 引入新内容时，它在结果节点解析。聚合结果可以返回带 `parse`、`onActive`、`dependencies` 的内容对象；它产生新同址贡献时，再按原始贡献完整重算，旧结果保留来源关系但不输出。隐藏的旧聚合声明仍是存活来源，它持有的按需产物不会仅因输出被隐藏而自动撤销：新增贡献可能正依赖这些资源，沿用 ASTSession 现有来源契约，无须为聚合扩展一套清理机制。无进展的持续生成仍由解析波和节点上限拒绝。

## 属性选择与最终验收

CSS 规范的 [`box-shadow` 值文法](https://www.w3.org/TR/css-backgrounds-3/#box-shadow)区分 `none` 和阴影列表；Value 默认连接内容，混合后的 CSS 是否有效仍由浏览器判断。编译期不从 `none` 推导清空历史贡献的行为。

本轮全量单测 217 项、真实浏览器测试 98 项、TypeScript 检查与生产构建通过；`git diff --check` 通过。行为、约束、能力复用、重复识别与精简独立复查通过。暂存区保存上一版结果，本轮未修改其索引状态。

终局验收同时包含正反例：同地址、同名 Key 的重复声明默认成为逗号数组或由 `join` 改写，不跨 State 汇聚；单项仍输出自身，顺序颠倒与重复项不被无依据地交换或去重。

## 尚未覆盖的属性

除默认组合外，哪些 Key 需要专属 `join` 由后续业务需求决定。本次不据 CSS 属性语法给普通 Key 新增覆盖、去重或清空协议。若实施发现必须改变 AST Plan 已冻结的节点或输出契约，先拿证据审查两个 Plan 的交接。
