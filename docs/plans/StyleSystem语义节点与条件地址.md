# Style System 语义节点与条件地址 Plan

> 状态：TODO。本文记录当前讨论中的目标与未决问题；不表示现役 Style System 已实现中间节点或属性值聚合。本轮只修订 Plan，不修改实现。

## 目标

业务规则登记后、生成 CSS string 前，保留一份可由规则改写的有序 Style Node 队列。普通 Condition Path 是地址；State Condition 只限定同一受体上的节点何时生效，不进入该地址。生成 CSS 时，两类 Condition 都要参与输出。

用户提出的最小形状是：

```ts
styleNode = [[conditionPaths, stateConditions], [key, value]]
styleNodes = [styleNodeA, styleNodeB, styleNodeC]

// 同一条件下有更多属性时，内容也可以直接是属性对象：
styleNode = [[conditionPaths, stateConditions], { [keyA]: valueA, [keyB]: valueB }]
```

一个 `[key, value]` 是一项属性声明。需要多项属性时，内容扩成属性对象即可；这只是同一节点承载更多声明，不是新语义。队列位置已表达输入顺序，不预设额外的 `order` 字段、`contribute()` 函数或独立聚合节点。

## 对节点的理解

```text
styleNodes：
  [[[.button],           []],      [box-shadow, A]]
  [[[.button],           [hover]], [box-shadow, B]]
  [[[.button],           [focus]], [box-shadow, C]]
  [[[.button, & .icon],  [hover]], [opacity, 0.7]]
```

上例只说明位置关系，不规定最终 API 或 CSS 写法。前三项具有同一个普通地址 `.button`；hover、focus 只改变各自节点的生效条件。最后一项的 `& .icon` 是普通 Condition，进入地址，指向另一个受体；其 hover 仍是 State Condition。按地址前缀看可以呈树状，但队列本身就是中间表示，不因画成树而重排节点。

State Condition 的身份来自 `stateCondition(...)` 的认定，不根据 CSS 文本猜测。`:is()` 若在被认定的条件内且仍约束当前受体，就按 State Condition 处理；普通 Condition 即使写了 `:is()`，也不会因此自动变成状态。未被认定为 State Condition 的 Condition 保留在普通地址中。

CSS Property Value 聚合仍是本 Plan 要解决的用途：多项独立声明可对同一属性提供内容，规则在中间节点上改写，最后再生成 CSS。**节点形状本身没有规定哪些声明应聚合、怎样聚合。**这些判断应在具体规则中证明，而不提前引入统一的 Contribution 类型或操作 API。普通属性声明仍须保持已有覆盖与层叠语义。

## 当前实现与待做步骤

现役 [Rule](../../src/style-system/core/css-rule.ts) 已按顺序保存路径、目标与内容，[CSSRoot](../../src/style-system/core/css-root.ts) 从源账本编译快照。现役 [State Condition](../../src/style-system/state-conditions.ts) 有独立身份，但 [编译器](../../src/style-system/compiler/compile-css.ts) 最终把地址和状态一起降成 [CSS 文本记录](../../src/style-system/compiler/css-records.ts)。本 Plan 不把现役 `Rule` 或 CSS 记录称为已完成的 Style Node 队列。

1. 对照现役 [Condition](../../src/style-system/core/css-condition.ts)、Rule 与 State Condition，确定如何从登记内容取得 `conditionPaths`、`stateConditions` 和属性声明，不丢失原有次序。
2. 在源账本快照与 CSS string 之间形成上述最小节点队列，确定规则如何读取、改写它；先保持原有普通声明的输出结果。
3. 以 `box-shadow` 的多份独立内容验证改写后的聚合，再用 `background-image` 检查不同属性的组合语义。不得从已经输出的 CSS 字符串反向猜测贡献关系。
4. 最后将普通地址与 State Condition 转换成 CSS 输出，保持 `compileCSS(): string` 的公开边界。

## 验证与未决

- 相同普通地址、不同 State Condition 的节点，保持同一受体；生成 CSS 后仍由浏览器判断各状态是否成立。
- 普通 Condition 改变地址，State Condition 不改变地址；相同 CSS 文本不会自动取得 State Condition 身份。
- 节点队列原有顺序和普通属性层叠结果不被地址分组或规则改写意外改变。
- `box-shadow` 的有效内容按已确定的顺序聚合；全部可选内容失效、多个状态同时生效时仍产生符合属性语法的结果。

以下仍需讨论，不能用节点形状替它们作答：

- 哪些具体规则会改写节点？规则如何表示与执行？
- 一项属性声明何时按普通覆盖处理、何时参与聚合？`box-shadow` 与 `background-image` 是否需要不同的规则？
- 多项属性放在同一节点时，改写其中一项是否影响其余属性？保留多项声明的原有顺序应采用何种内部形状？
- State Condition 在公开输入中以构造所得对象还是已登记名称引用？如何保证被认定的条件仍约束当前受体？
- 多个条件同时成立时，最终 CSS 如何表达有效内容的组合，而不要求编译器在运行前判断浏览器状态？
