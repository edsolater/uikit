# Subject Condition

本文定义 Condition 成为 Subject Condition 的资格，以及它在 Rule、Value、Variable 和编译器中的边界。当前实现已接入 `compileCSS()`，文件职责与运行链见 [架构](architecture.md)。

# 成为 Subject Condition 的资格

Subject Condition 是 Style System 安装后可由名称复用的 Condition。它可以进入 Rule 地址，也可以供 Value 与 Variable 选择分支。它必须遵守两项语义契约：

- 条件约束的对象始终是当前主体，只缩小当前声明的适用范围。
- 与其他 Subject Condition 满足交换律；先嵌套 A 再嵌套 B，与先嵌套 B 再嵌套 A，表示相同的适用范围。

这是定义者遵守的君子协定。编译器不分析 selector 或 At Rule 来证明主体稳定和交换律；一个 Condition 被登记为 Subject Condition，就表示它已经满足这两项契约。

语法种类不能单独决定资格。hover 可以成为 Subject Condition；容器或媒体条件只要满足上述契约，也可以成为 Subject Condition。会改变主体，或者嵌套顺序会改变含义的 Condition，不能成为 Subject Condition。

# 固定身份与嵌套顺序

每个 Subject Condition 包含固定名称、一个已有 Condition 和顺序；CSS header 仍由该 Condition 提供。Rule、Value 与 Variable 只写名称字符串，不导入条件对象。

当前内置名称：

```text
focus        → &:focus
focusWithin  → &:focus-within
focusVisible → &:focus-visible
hover        → &:where(:hover):not(...)
active       → &:where(:active):not(...)
disabled     → &:is(:disabled, ...)
```

这些名称是预装项。定义层也可以用 `subjectCondition(name, condition)` 安装其他 Subject Condition。

Rule 地址中的字符串命中已安装名称时，使用对应 Condition；未命中时仍是普通 CSS 地址：

```ts
rules([button, 'focusVisible'], declarations)
rules([button, '&[data-tone="danger"]'], declarations)
```

Rule 地址中的普通部分保持原顺序；已安装名称去重、按中央顺序排列，再约束该普通地址确定的主体。

可由定义层另行登记的示例；`compactContainer` 当前不是内置名称，使用前必须确定具体查询并登记：

```text
compactContainer → @container (...)
```

不同容器查询是不同的 Subject Condition。名称决定身份，定义顺序决定嵌套路径中的排列；调用处的出现顺序不改变结果。

有效顺序同时负责路径规范化和取值优先级，目前来自注册顺序：后注册的已有匹配分支优先。路径可交换来自君子协定，取值优先级来自单独约定，不能仅由交换律推出。

编译器不拼接 Subject Condition 的 selector，也不创建组合 selector。它把规范化后的 Condition 逐层加入路径，最终由 CSS 记录按层嵌套：

```text
条件路径 [A, B]

A {
  B {
    declaration
  }
}
```

`default` 是 Value 或 Variable 的缺省值，不是 Subject Condition，也不占组合位置。

# 不能成为 Subject Condition 的情况

不满足主体稳定或交换律的内容继续使用普通 Condition，例如：

- 子元素、祖先或兄弟成为声明主体的 selector。
- `&&`、`:where(&)`、`&:has(+ &)`。
- `@scope`、`@layer`、`@function`、`@keyframes`、`@property`。

# Value 合并条件身份

先确定目标激活集合，再让每个 Value 按有效顺序选择自身最后匹配分支；没有匹配才 default。分支对象的书写顺序不改变优先级；没有高优先级分支时仍保留自身已有的匹配。

调用处通常用对象表达“名称对应值”：

```ts
value(0.82, { hover: 0.72, active: 0.62 })
```

动态调用也可传入 Map、Set、键值数组或其他键值 Iterable；这些输入只负责形成同一份名称映射，不改变分支语义。字符串虽可按字符遍历，但不包含“名称对应值”，不能作为分支集合。

合并时：

- `default` 不增加条件。
- 相同条件只保留一次。
- 不同条件共同保留。
- 最终按 Subject Condition 的固定顺序形成嵌套路径。
- 编译器不判断组合是否能够匹配，交给 CSS 引擎。

例如，A、B、C 表示三个不同的 Subject Condition：

```text
Value 1：default、A、B
Value 2：default、B、C
```

需要表达的激活集合为：

```text
default、A、B、C、[A, B]、[A, C]、[B, C]、[A, B, C]
```

假定注册顺序为 A、B、C，同时激活时 Value 1 取 B、Value 2 取 C。分支只取一个，不代表其他条件不激活。重复出现的条件身份只保留一份。

当一个 Value 受 `hover` 影响、另一个 Value 受 `compactContainer` 影响时，编译器生成 default、hover、compactContainer，以及包含二者的规范嵌套路径。具体先后由中央顺序决定；无论先后，最后一项都是两层 Condition，不是把两个 header 拼成一个 selector。CSS 属性值是一个整体；如果编译器不生成这条嵌套路径，浏览器不能把两条声明中的不同 Value 片段拼成完整结果。

# Variable 只改写自身

Variable 的 Subject Condition 只改变同名 Custom Property，不加入消费表达式的 Subject Condition 集合。

例如 Variable 1 有 default、A、B，普通 Value 2 有 default、B、C：

- Variable 1 在 default、A、B、[A, B] 下写入 `--v1`，组合时按自身分支选 B。
- 消费表达式只按 Value 2 的条件生成 default、B、C、[B, C]，不受 A 扩散。
- A 与 C 同时匹配时，C 规则仍引用 `var(--v1)`，浏览器取得 A 下的变量值。

两个输入都是 Variable 时，消费它们的属性只输出一次；各 Variable 在自己的 Subject Condition 下改写值。

# 与现有对象的关系

- 普通 Condition 组成有序 Rule Path，保留顺序和重复项。
- Rule 地址可以引用已安装名称；未安装字符串仍按普通 CSS 地址处理。
- Value 与 Variable 的条件分支必须引用已安装名称，未知名称终止编译。
- 普通 Value 的分支条件向消费表达式传播；Variable 的分支条件停留在自身定义。
- 编译器把普通 Value 贡献的名称合并、去重、排序，再把对应 Condition 逐层追加到 Rule Path。

当前由 [subject-conditions.ts](subject-conditions.ts) 的 `subjectCondition(name, condition)` 集中安装，安装次序就是固定嵌套顺序。Style System 预装常见交互名称；编译器不分析资格，也不拼接 header。
