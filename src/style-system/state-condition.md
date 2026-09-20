# State Condition

State Condition 描述当前主体自身的状态，例如 hover、active、disabled、focusVisible。它保存名称、已有 Condition 和固定顺序，不描述语气，也不把目标切换成子元素或其他主体。

## 名称与顺序

[state-conditions.ts](state-conditions.ts) 统一安装 focus、focusWithin、focusVisible、hover、active、disabled。定义者可以通过 stateCondition(name, condition) 增加名称，但必须保证条件仍约束同一主体，条件组合的路径可以交换。

普通选择器、@layer、@function、@keyframes 等结构继续使用 Condition，不因能够嵌套就成为状态。未知状态名称终止编译；空名称、default 和重复登记报错。

Rule 地址中的已安装名称保留状态身份，普通 CSS 地址保持原顺序。状态名称去重后按中央顺序输出；同一个 Variable 同时命中多个已定义状态时，较后登记的状态优先。

## Variable 自己负责状态

```ts
const feedbackColor = variable(baseColor, {
  name: 'feedback-color',
  states: {
    hover: hoverColor,
    active: activeColor,
  },
})
```

编译器只为 feedbackColor 自身生成状态声明，使用它的 color 或 colorMix 不获得这些分支。为了让固定顺序不受选择器特异性影响，同一个 Variable 保留自身状态的交集。

例如 A 的选择器是 &[data-a]，B 是 &:where([data-b])。B 的特异性较低，单独后写仍不足以压过 A；A 与 B 的交集声明采用 B 的内容，使中央顺序成立。交集不跨普通 Value 依赖图扩张。

## 延伸时沿引用链查找

```ts
const localColor = variableFrom(feedbackColor, {
  name: 'local-color',
  states: {
    active: source => colorMix(source, 'white'),
  },
})
```

localColor 自己定义 active，其他状态沿 feedbackColor 查找。active 回调中的 source 就是原 feedbackColor 对象，作为黑盒值使用；浏览器取得来源在 active 下成立的值。调用者不读取 source.states。

继续延伸仍遵循相同规则，不复制定义。自身明确给出的 0 等有效值不会被当成缺失。

## Value 不拥有状态

普通 Value 仅表达稳定内容。混色函数即使使用多个有状态 Variable，也只输出一次消费属性，浏览器分别解析各 Variable 当前的值。状态定义、延伸链和普通值组合各自承担自己的职责。
