adjust 和 modify 让业务对完整定义表达一次变化，无需枚举里面的 states 和 variants。Modification 描述变化本身；adjust 将它用于创建新的 Variable，modify 将它用于指定条件内的目标声明。两者的输出不同，不因此给 Variable 增加新的身份类别。

# Modification 作用于各自结果

以下用算术伪代码说明结果关系，不是当前 adjust 的可执行参数示例：基础 10，hover 规则加 3，active 固定 12，wide 的 variant 规则乘 2，对每条结果应用乘 0.5 的 Modification。真实颜色 API 见下一节。

| 路径 | 应用前 | 应用后 |
| --- | --- | --- |
| 普通 | 10px | 5px |
| hover | 13px | 6.5px |
| active | 12px | 6px |
| wide 普通 | 20px | 10px |
| wide hover | 23px | 11.5px |
| wide active | 12px | 6px |

伪代码是 `result = apply(modification, selectedValue)`。不能只加工普通值而漏掉固定 state；也不能先改基础，再把同一次加工对 state 结果重复执行。variant 的 state 顺序由 [Variable的创建与复用.md](Variable的创建与复用.md) 给出，所以 wide hover 不是 13px，也不是 23px 未加工。

# 保留来源，还是改变目标

```ts
const surface = variable('red', {
  name: 'surface', address: '.Button',
  states: { hover: 'blue' }, variants: { line: 'green' },
})
const halfAlpha = modification({ type: 'color', detail: { alpha: 0.5 } })
const faded = adjust(surface, halfAlpha)
rules('.Button', [color({ background: faded })])
```

颜色 Modification 中，固定通道值表示替换，通道回调表示相对变化，未指定的通道保留。此处 alpha:0.5 是将透明度设为 0.5，不是乘 0.5；对原透明度 0.8，设置得到 0.5，而相对减半得到 0.4。

adjust 返回普通 Variable，沿用来源 address；结果内容保留所需 CSS 引用，来源本身不变。结果的基础、states 和 variants 已表达这次变化；其他 API 按普通 Variable 处理它。上述 Button 普通半透明红、hover 半透明蓝；选择 faded.variant('line') 普通半透明绿，hover 半透明蓝。surface 仍是普通红色、hover 蓝色、line 绿色。

若希望目标自身在匹配范围改变，用下段替代上面的 adjust 使用：

```ts
rules('.Button', [modify(surface, halfAlpha), color({ background: surface })])
```

modify 返回可登记的声明，仅在明确条件内加工目标全部结果；条件外保留原结果。它不要求业务先无值 declare、重传创建内容或手工铺设依赖。states 的归属仍是原根据地，不因当地 modify 自动移植到每个消费者。

对来源显式 modify 后，引用来源的 adjust 也可能读取该变化；不能一边修改来源，一边把调整结果当作未修改来源的对照。配方输入的 CSS 引用同样保留，但仅在实际公式位置响应，不能 [CSS作用域与层叠.md](CSS作用域与层叠.md#同一边界也约束修改配方)。

# 根据地状态与当地修改怎样组合

若 size 的根据地在根，普通 4px，根的 data-phase state 为 8px；Parent 明确 modify 加 3px，Child 位于 Parent 内且只读取 size，则可由两条规则推导：state 先在根选择，Parent 再加工这个结果，Child 继承 Parent。

| 条件 | Parent | Child |
| --- | --- | --- |
| 根无标记 | 7px | 7px |
| 仅 Parent 或 Child 有 data-phase | 7px | 7px |
| 根有 data-phase | 11px | 11px |

这里完整加工保留了根 state 的效果，却没有把 state 条件移到 Parent 或 Child。若只因消费就让 Child 拥有自己的 data-phase state，便违背根据地归属；若根切 state 后 Parent 仍固定为 7px，则漏掉了全结果加工。这个推导不要求通过复制 state 定义或消费处公式实现。

# 多步修改保留顺序与退出关系

```ts
const size = variable('4px', { name: 'meter-size', address: '.Meter' })
rules('.Meter', [
  modify(size, { type: 'expression', detail: current => add(current, '3px') }),
  modify(size, { type: 'expression', detail: current => multiply(current, 2) }),
  [key('width'), size],
])
```

先加再乘为 14px，交换为 11px。current 表示当前 CSS 表达式，不要求 JS 先求浏览器数值。撤销乘法步骤后为 7px；不能把整条链删掉，也不能让剩余步骤重复执行。嵌套主体不能无意把同一步累计两次。

不同 id 表示独立步骤；共享 id 表示同一步在不同条件下的候选，按 CSS 条件与层叠选择，不累计成两步。同完整地址中，先新值后 modify 加工新值，后写新值覆盖此前修改；不同地址仍遵循 CSS。属性注册的类型、继承和初始值约束继续成立。

变化材料显式替换后，默认、state 与 variant 均应采用新变化，旧独占资源退出；其余步骤和共享资源继续有效。内容更新沿用公共内容协议，不为 modify 另设一套更新规则。回调执行与显式失效的当前约定见 [扩展协议](../当前接口与扩展协议.md#明确改变输入后读取新结果)。

# 新 Variable 仍按普通规则使用

沿用前面的 surface 与 faded，faded 的基础是半透明红，hover 是半透明蓝，line 的基础是半透明绿。这些就是结果 Variable 的定义，不是一份还需要后续 API 执行的 Modification。

```ts
const copied = variableFrom(faded, 'gold', 'copied-color')
```

copied 的基础为 gold；hover 原样继承半透明蓝的固定定义，line 原样继承 faded 的 variant 定义。新的 gold 不会因为 faded 由 adjust 创建，就再被自动设为半透明。这里继承的是 faded 交付的定义，不绕过它去拿 surface 的原始定义。

在 faded 的根据地执行 `declare(faded, 'gold')`，也按普通 Variable 处理：基础为 gold，已有固定 hover 保持半透明蓝。赋值不修改 faded 的 JS 定义，更不修改 surface。若在其他地址赋值，则按普通 declare 规则只改变当地值，不在那里复制 states。

结果内容的实际依赖继续遵循 [按需资源与同名替换.md](按需资源与同名替换.md)，CSS 动态引用继续遵循 [CSS作用域与层叠.md](CSS作用域与层叠.md)。这两项公共契约不要求消费方了解 adjust 的内部构造。
