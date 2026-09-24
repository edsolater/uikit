`variable(...)` 声明 Variable 对象，`variableDeclare(...)` 在 CSS 规则位置定义它，`variableModify(n, change)` 提供一份修改参数。编译器沿 Rule／Condition 的 AST 路径找到最近的目标定义，再逐步调用 Variable 配置中的 `modification.apply`，生成条件计算链。

本文用完整的输入与 CSS 输出说明当前设计。以下新 API 与编译方式仍是讨论方案，尚未实现；`calcAdd` 是构造 CSS 加法表达式的工具示意。

# 为什么把声明、定义和修改分开

调用者需要在多个条件下修改同一个 Variable，又不想为条件组合手动创建另一组 Variable。因此，Variable 对象保存“如何解释一份修改参数”，CSS 规则决定“在哪里定义它、在哪里提交参数”，编译器连接二者。

三个入口各负责一件事：

| 入口 | 作用 |
| --- | --- |
| `variable(1, options)` | 声明对象，保存初始内容和包含 `name` 的配置；可选 `modification.apply` 解释单步修改 |
| `variableDeclare(n)` | 在当前 CSS 规则位置定义 `n`，成为修改的归属点 |
| `variableModify(n, 3)` | 创建特殊 Declaration，携带目标对象与修改参数，惰性留到编译时解析 |

修改项不创建派生 Variable，也不属于普通 ValueTransform 或 Cluster 专有能力。本文中的“修改声明”指 `variableModify` 返回的特殊 Declaration，与声明 Variable 对象是不同动作。

# 完整输入：悬停加 3，聚焦加 5

```js
const button = condition('.button')
const hover = condition('&:hover')
const focus = condition('&:focus')

const n = variable(1, {
  name: 'n',
  modification: {
    apply: (currentValue, change) => calcAdd(currentValue, change),
  },
})

rules([button], [
  variableDeclare(n),
  rules([hover], [variableModify(n, 3)]),
  rules([focus], [variableModify(n, 5)]),
])
```

`variable` 的配置仍是对象。这里的 `apply` 只接收前序表达式和一份 `change`，返回下一步表达式；`variableModify(n, 3)` 只保存参数，不在创建时求值。

外层 `states` 保留表达状态结果的能力，与可选的 `modification` 分开。状态结果如何成为修改链的基础值、与修改的先后关系，尚需明确；本例只使用默认基础值 `1`，不借例子定案这部分语义。

本例采用先处理 hover、再处理 focus 的顺序，供展示编译过程。多个修改的一般排序规则仍需明确，不能把鼠标或键盘的交互先后当作编译顺序。

# 完整输出：默认传递，匹配时覆盖

上述输入的一份候选 CSS 输出如下：

```css
.button {
  --n-base: 1;
  --n-step-1: var(--n-base);
  --n-step-2: var(--n-step-1);
  --n: var(--n-step-2);
}

.button:hover {
  --n-step-1: calc(var(--n-base) + 3);
}

.button:focus {
  --n-step-2: calc(var(--n-step-1) + 5);
}
```

两个编译作用分别落在两个位置：

1. 在 `variableDeclare(n)` 对应的 `.button` 定义处，扩建基础值、内部步骤和最终 `--n`。
2. 在每个 `variableModify` 原有的 selector／Condition 位置，只留下对应内部步骤的赋值。

内部步骤默认传递前序值，条件成立时由 CSS 覆盖该步。在第二步，前序值可能已经加了 `3`，也可能仍是基础值；不需要 JavaScript 在运行时判断哪个修改激活。

例如，把输出 CSS 用于 `<button class="button">按钮</button>`，结果如下：

| 条件 | 第一步 | 第二步与最终 `n` |
| --- | --- | --- |
| 未悬停、未聚焦 | `1` | `1` |
| 仅悬停 | `1 + 3 = 4` | `4` |
| 仅聚焦 | `1` | `1 + 5 = 6` |
| 悬停且聚焦 | `4` | `4 + 5 = 9` |

这份 CSS 已在 Chrome 153.0.8010.53 中用 `z-index: var(--n)` 验证：四种状态依次得到 `1、4、6、9`；退出悬停但保留聚焦时为 `6`，退出全部条件后为 `1`。该验证只证明本例 CSS 行为，不代表拟议 JS API 或编译器已经实现。

条件退出时，对应步骤恢复默认传递，不累计上一次交互结果。没有修改生效时返回基础值；将来接入外层状态结果时，也应衔接该状态的基础值，不另设一套未激活值。

# apply 在编译期怎样执行

编译器对上述两个修改分别执行以下操作。其中 `apply` 取自 `n` 的修改配置，引用名表示内部表达式对象，不是提前拼好的 CSS 字符串：

```js
const firstExpression = apply(baseReference, 3)
const secondExpression = apply(firstStepReference, 5)
```

这是编译过程示意。第一次调用得到 `calc(var(--n-base) + 3)` 的表达式结构；第二次得到 `calc(var(--n-step-1) + 5)` 的结构。前序引用到输出阶段才成为 CSS 文本。

`currentValue` 表示当前步骤之前的表达式或内部引用，不是目标自身的 `var(--n)`，不是浏览器 computed value，也不是上一次交互的结果。编译时需要为两条规则都构造表达式；浏览器运行时通过选择器匹配决定覆盖哪些步骤。

这种接口表达的是**顺序变换**。若另一个 Variable 的 `apply` 按各自参数依次生成加 `1`、乘 `2`，两个条件都成立时，表达式关系为：

```text
base → add(base, 1) → multiply(add(base, 1), 2)
```

初值为 `1` 时结果为 `4`，换成先乘再加则为 `3`。更一般的关系是 `f3(f2(f1(base)))`，不能把所有修改降成数值增量求和。接口也不自动承诺“收集全部激活参数再求平均”等全局聚合能力。

# 修改沿 AST 路径找到定义

上面的嵌套 `rules` 保留为 Rule／Condition 路径。它不是先压平成选择器文本，再猜测哪些 DOM 元素有祖先关系。

```text
Rule(.button)
├─ Define(target: n)
├─ Rule(&:hover)
│  └─ Modify(target: n, change: 3)
└─ Rule(&:focus)
   └─ Modify(target: n, change: 5)
```

编译器从每个修改项所属的 Condition 节点开始，沿 AST 父链寻找最近的 `n` 定义，按 Variable 对象身份匹配。本例两项都找到 `.button` 节点内的 `variableDeclare(n)`；如果更近的节点定义了同一个对象，则以那个定义为归属点。名称 `n` 用于输出命名，不代替对象身份。

这条路径已经提供归属关系，无须另外公开 controller、Symbol 或 modifier 字符串。沿路径没有找到定义时，不能偷偷绑定到某个全局定义；具体报错或诊断方式仍待确定。

## 编译归属不改变 CSS 作用位置

即使一个修改项沿 AST 父链归属于 `.button`，它的 selector 仍决定内部赋值实际匹配哪些元素。例如，将本例第二个子规则改成 `condition('& .child')`，对应输出仍在 `.button .child` 处：

```css
.button .child {
  --n-step-2: calc(var(--n-step-1) + 5);
}
```

目标计算结构仍在 `.button` 的原 CSS 定义位置。编译器不会搬动这条选择器，也不会在 `.child` 补写最终 `--n` 或重建计算链。子元素的内部步骤可以改变，但祖先的最终值不会受它影响，继承下来的最终 `--n` 也不会自动重新绑定输入。

因此，AST 父链解决的是“这项修改属于哪个定义”，CSS 的匹配、层叠与继承解决的是“生成的赋值在浏览器中有什么效果”。选择器不符合使用意图时，编译器不自动修复。

# 从规则快照到 CSS string

**编译输入是登记完成的规则与 Declaration 快照，输出是一次 CSS string。** 公共边界仍为 `compileCSS(): string`；内部阶段一次完成，挂载后由 CSS 处理交互，不新增公开序列化步骤。

1. **保留语义结构。** 保存 Rule／Condition 父链、Variable 身份、定义项、修改参数和待确定的顺序信息。此时保留对象引用，不提前替换为 CSS 名字。
2. **解析归属与表达式。** 沿 AST 路径找到最近目标定义，按确定的顺序调用 `apply`，形成前序表达式链。回调返回的新引用统一进入依赖处理，并检查循环。这是执行已传入的函数，不是解析任意 JS 源码。
3. **生成 CSS AST。** 在目标原定义处建立基础值、默认步骤和最终计算；在修改原位置输出内部步骤赋值。CSS AST 只保留要输出的 CSS 规则与表达式。
4. **输出字符串。** 将检查完成的 CSS 节点转为文本，不再新增业务组合或未解析依赖。

保留 AST 是为了让编译器知道“哪个对象、最近哪个定义、哪个前序步骤、哪两个输出位置”。过早生成字符串会丢失这些关系；是否需要两套独立 AST 类型，应按实际结构差异决定，不预先要求重写现有编译器。

## 扩展与依赖从哪里进入

改写定义、修改项或表达式的规则放在语义阶段。例如把参数 `3` 改成另一个 Variable 的引用，新增依赖必须继续进入统一处理；不能只在变换前扫描一次。变换能否重复处理自己的输出及其执行顺序，需要明确。

CSS AST 阶段的变换不再引入未解析 Variable，字符串阶段只输出文本。按需展开也属于内部职责：可以省略没有保留入口且未消费的定义，但条件规则中的引用仍需在编译时处理，不能等到 hover 才执行 `apply`。

# 当前边界与待定事项

现役 [Declaration 协议](../core/css-declaration.ts) 以 `[key, content]` 表达普通 CSS 项，现有 `declare` 不能直接等同于本文拟议的 `variableDeclare`。[编译入口](../core/css-root.ts) 已提供 `compileCSS(): string`，新设计应在该公共边界内实现。

仍需确定多个修改的顺序、同一 AST 节点有多次目标定义时的选择、基础内容赋值与修改的关系，以及外层 `states` 与基础表达式的衔接。不同定义上下文的缓存、缺失定义诊断、回调副作用、引用循环和变换不终止，也需要明确约束。

内部步骤数随实际修改项增长。大量已声明状态与候选结构的输出规模问题仍未解决，顺序链与 AST 都不能据此宣称消除了容量成本。

记住这条路径：**声明对象保存 `apply`，CSS 定义提供归属点，修改项提供参数；编译器在原定义处扩建计算，在修改原处赋内部变量。**
