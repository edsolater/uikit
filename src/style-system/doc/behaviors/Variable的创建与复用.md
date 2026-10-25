Variable 是一份可复用的样式定义骨骼，包含基础内容、states 和 variants。它尚未成为页面样式，但让业务能换基础而不必了解内部全部反馈。创建负责表达定义，使用负责提出 CSS 需求，两者不能混同。

# 根据地决定在哪里提供定义

每份 Variable 创建时指定 address（根据地），省略时为根元素。实际使用时，按 VariableName 对应的 CSS 名称与 address 查询 declaration：不存在才自动声明创建内容，存在就保留。此处判断的是同名同址的声明，不要求声明来自同一个 JS 对象。显式 undefined 也表示已经声明，不触发回填；这与它是否输出有效 CSS 值不同。

```ts
const size = variable('10px', {
  name: 'control-size', address: '.Control',
  states: { hover: base => add(base, '3px'), active: '12px' },
  variants: { control: base => multiply(base, 2), indicator: '7px' },
})
rules('.Control', [[key('width'), size]])
```

Control 普通宽 10px，hover 为 13px，active 为 12px。若根据地已显式声明 20px，普通为 20px、hover 为 23px、active 仍为 12px。若仅后代 Item 使用它，仍在 Control 保障声明，Item 按 CSS 继承；不能改在每个 Item 展开 state。

这个查询属于 Variable 被使用时的行为，由 AST 提供查询 API；不搜索最近祖先来重新决定根据地，也不另建 declare tree。VariableName 在这里用于定位 declaration，不负责按名称激活另一 Variable 的定义。根只是默认地址，不另设默认值系统。自动根声明不得凭更强的 CSS 权重压过显式主题。

真实赋新值用 `declare(size, newValue)`。在根据地赋值，state 规则作用于新基础；在其他地址赋值，只改变当地值，不携带整套 states。无值 declare 只是逃生舱，普通业务不应靠它或重传创建内容才能取得应有结果。

# 从已有定义复用规则

组件用 `variableFrom(source, options)` 取得自己的完整定义，只指定名称、根据地与差异。省略基础内容表示继承来源配方，在新根据地执行：

```ts
const local = variableFrom(size, { name: 'local-size', address: '.LocalControl' })
```

LocalControl 普通为10px，hover为13px，active为12px。来源所在元素的hover不会再叠加到它上面。配方中对其他材料的引用继续有效；若要直接读取来源自己的当前CSS值，使用 `variableFrom(size, size, options)` 明示依赖。两种关系分别是定义继承与值引用。

仅提供 onActive、compileWaveIndex 等内容协议字段的二参对象仍表示内容；配置这些项时同时指定 name、address 等配置字段，或使用三参数形式。

需要更换基础时，继续使用三参数形式：

```ts
const larger = variableFrom(size, '20px', {
  name: 'large-size', address: '.LargeControl',
})
rules('.LargeControl', [[key('width'), larger]])
```

新定义普通为 20px，hover 为 23px，active 仍为 12px。因为 hover 是相对规则，active 是固定值；继承不自动把固定值改成相对关系。states 和 variants 原样按名称继承，明确提供同名项时覆盖，其余保留。

两种形式都继承未指定的公开配置：name、address、priority、states、variants、registration、onActive 和 compileWaveIndex；显式配置只覆盖对应项。states 和 variants 按名称合并，三参数形式的名称也可用函数从来源名称生成。复用不改变来源，也不持续同步来源后来发生的 JS 配置变化。

# 映射各项最终取值

`mapVariableRules(source, mapResult, nameOrOptions?)` 对默认、state、variant 各自的最终取值表达式应用一次 mapResult，返回普通 Variable。配置沿用相同的继承规则；显式给出的 state 或 variant 覆盖已映射的对应定义，不再额外经过这次映射。

以基础 10、hover 为基础加 3、active 固定为 12 的定义为例：

| 操作 | 普通 | hover | active |
| --- | --- | --- | --- |
| 替换基础为 5 | 5 | 8 | 12 |
| 将各项结果乘 0.5 | 5 | 6.5 | 6 |

映射先取得来源各项结果，再加工；不能把原 hover 规则套在已加工基础上。映射结果交付的是这份新定义，后续 variableFrom 或 declare 不对新基础重新执行旧映射。来源有真实表达式依赖时，结果继续保留这些依赖。

省略 name 时沿用来源的 VariableName，不分配新名称。同名的来源与结果仍遵循普通 CSS 声明和层叠关系，不承诺两个同名值隔离；单独使用映射结果时不能生成对自身 CSS 名称的循环引用。

# 选择一种用途

```ts
rules('.LargeControl', [
  [key('width'), larger.variant('control')],
  [key('height'), larger.variant('indicator')],
])
```

这一段替代上节仅设置 width 的规则。先将 larger 的 20px 应用到用途定义，取得该用途自己的基础；再对这个基础应用继承 state：

| 所选定义 | 普通 | hover | active |
| --- | --- | --- | --- |
| larger | 20px | 23px | 12px |
| control | 40px | 43px | 12px |
| indicator | 7px | 10px | 12px |

这里 control 与 indicator 表达控件本体和指示标记两个部分；尺寸大小或强调程度是对象状态，不作为用途名称。

生成规则的伪代码：

```text
variantBase = evaluate(variantDefinition, sourceBase)
stateValue = evaluate(stateDefinition, variantBase)
```

evaluate 对规则传入 base，对固定值原样返回。state 不先作用于 sourceBase 再传入 variant，因此 control 的 hover 不是 46px。

variant 返回普通 Variable，继承根据地和 state，名称区分所选用途；消掉父层 variants，不把它们原样再挂回结果。它仍可作为 variableFrom 来源；例如 control 换基础为 50px 后 hover 为 53px。嵌套用途保留为未来可能性，当前不提供；未知用途明确失败。

# 具体对象携带定义，名称只标识 CSS

两份 Variable 可以同名，但不能因此相互借用 state、资源或激活关系。只用红色对象，不应使另一个同名蓝色对象的生产函数运行。若两者都输出同名 CSS 属性，其实际相互影响由 CSS 层叠决定；JS 对象独立不意味着 CSS 名称隔离。

VariableName 保留对象能力，也能字符串化供命名函数或模板使用。例如 String(v.name) 得到逻辑名称，VariableName 作为内容使用时表达 CSS 引用；两者都不查找或激活同名 Variable 定义。完整调用约定见 [当前协议](../当前接口与扩展协议.md#variable-输入命名与可选配置)。

variableFrom 只关心传入的 Variable 定义，不区分它由 variable、variant 或 adjust 创建。新基础直接成为新 Variable 的基础；来源已有的 states、variants 按相同规则继承，不额外执行某段创建历史。adjust 怎样产生这份定义，见 [adjust与modify.md](adjust与modify.md)。


用途需要自己的状态时，返回与 variable 相同的状态简写，不另建一份子材料再搬地址：

```ts
const panelColor = variable(sourceColor, {
  name: 'panel-color', address: '.Panel',
  states: { hover: base => oklch(base, { alpha: 0.8 }) },
  variants: {
    boundary: base => ({
      default: oklch(base, { alpha: 0.44 }),
      hover: boundary => oklch(boundary, { alpha: 0.6 }),
    }),
  },
})
```

boundary 的 hover 覆盖主体同名状态，未覆盖的状态仍继承；address 同样沿用主体。根主题与局部交互应由各自来源负责，不能把根的 dark 条件搬成对局部元素 data-theme 的要求。
