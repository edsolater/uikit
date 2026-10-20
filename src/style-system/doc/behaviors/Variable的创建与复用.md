Variable 是一份可复用的样式定义骨骼，包含基础内容、states 和 variants。它尚未成为页面样式，但让业务能换基础而不必了解内部全部反馈。创建负责表达定义，使用负责提出 CSS 需求，两者不能混同。

# 根据地决定在哪里提供定义

每份 Variable 创建时指定 address（根据地），省略时为根元素。实际使用时，按 VariableName 对应的 CSS 名称与 address 查询 declaration：不存在才自动声明创建内容，存在就保留。此处判断的是同名同址的声明，不要求声明来自同一个 JS 对象。显式 undefined 也表示已经声明，不触发回填；这与它是否输出有效 CSS 值不同。

```ts
const size = variable('10px', {
  name: 'control-size', address: '.Control',
  states: { hover: base => add(base, '3px'), active: '12px' },
  variants: { wide: base => multiply(base, 2), fixed: '7px' },
})
rules('.Control', [[key('width'), size]])
```

Control 普通宽 10px，hover 为 13px，active 为 12px。若根据地已显式声明 20px，普通为 20px、hover 为 23px、active 仍为 12px。若仅后代 Item 使用它，仍在 Control 保障声明，Item 按 CSS 继承；不能改在每个 Item 展开 state。

这个查询属于 Variable 被使用时的行为，由 AST 提供查询 API；不搜索最近祖先来重新决定根据地，也不另建 declare tree。VariableName 在这里用于定位 declaration，不负责按名称激活另一 Variable 的定义。根只是默认地址，不另设默认值系统。自动根声明不得凭更强的 CSS 权重压过显式主题。

真实赋新值用 `declare(size, newValue)`。在根据地赋值，state 规则作用于新基础；在其他地址赋值，只改变当地值，不携带整套 states。无值 declare 只是逃生舱，普通业务不应靠它或重传创建内容才能取得应有结果。

# 从已有定义复用规则

```ts
const larger = variableFrom(size, '20px', {
  name: 'large-size', address: '.LargeControl',
})
rules('.LargeControl', [[key('width'), larger]])
```

新定义普通为 20px，hover 为 23px，active 仍为 12px。因为 hover 是相对规则，active 是固定值；继承不自动把固定值改成相对关系。states 和 variants 原样按名称继承，明确提供同名项时覆盖，其余保留。

`variableFrom(source, value, nameOrOptions?)` 后两项与 variable 的材料位置一致。名称可沿用、明确替换或用函数从来源名称生成；根据地省略时沿用来源，明确提供时只改变新定义。复用不改变来源，也不持续同步来源后来发生的 JS 配置变化。

# 选择一种用途

```ts
rules('.LargeControl', [
  [key('width'), larger.variant('wide')],
  [key('height'), larger.variant('fixed')],
])
```

这一段替代上节仅设置 width 的规则。先将 larger 的 20px 应用到用途定义，取得该用途自己的基础；再对这个基础应用继承 state：

| 所选定义 | 普通 | hover | active |
| --- | --- | --- | --- |
| larger | 20px | 23px | 12px |
| wide | 40px | 43px | 12px |
| fixed | 7px | 10px | 12px |

生成规则的伪代码：

```text
variantBase = evaluate(variantDefinition, sourceBase)
stateValue = evaluate(stateDefinition, variantBase)
```

evaluate 对规则传入 base，对固定值原样返回。state 不先作用于 sourceBase 再传入 variant，因此 wide 的 hover 不是 46px。

variant 返回普通 Variable，继承根据地和 state，名称区分所选用途；消掉父层 variants，不把它们原样再挂回结果。它仍可作为 variableFrom 来源；例如 wide 换基础为 50px 后 hover 为 53px。嵌套用途保留为未来可能性，当前不提供；未知用途明确失败。

# 具体对象携带定义，名称只标识 CSS

两份 Variable 可以同名，但不能因此相互借用 state、资源或激活关系。只用红色对象，不应使另一个同名蓝色对象的生产函数运行。若两者都输出同名 CSS 属性，其实际相互影响由 CSS 层叠决定；JS 对象独立不意味着 CSS 名称隔离。

VariableName 保留对象能力，也能字符串化供命名函数或模板使用。例如 String(v.name) 得到逻辑名称，VariableName 作为内容使用时表达 CSS 引用；两者都不查找或激活同名 Variable 定义。完整调用约定见 [当前协议](../当前接口与扩展协议.md#variable-输入命名与可选配置)。

variableFrom 只关心传入的 Variable 定义，不区分它由 variable、variant 或 adjust 创建。新基础直接成为新 Variable 的基础；来源已有的 states、variants 按相同规则继承，不额外执行某段创建历史。adjust 怎样产生这份定义，见 [adjust与modify.md](adjust与modify.md)。
