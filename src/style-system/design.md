# Style System 2.0 设计

本文说明 Style System 2.0 已确定的对象模型和编译语义。当前文件职责见 [architecture.md](architecture.md)，组件样式写法见 [样式文件写法](../../docs/style/样式文件写法.md)。

# 设计目标

样式作者只表达“哪个地址拥有什么值”，不为最终 CSS 的花括号手工创建 Block：

- Condition Path 表达地址。
- `rule()` 登记一条源配置，`rules()` 按顺序批量登记，账本由 CSSRoot 持有。
- Declaration 与 Value 保存尚未展开的语义。
- `compileCSS()` 在执行时解读全部源配置，展开条件、属性和值，并返回 CSS string。
- CSS Variable、Keyframes 和 CSS `@function` 等依赖，只在编译器真正访问相应 Value 时进入本次结果。

Block、StyleRule、MediaRule 和 KeyframeRule 不再是对象模型。它们在最终 CSS 中的结构，都由 Condition Path 和编译规则生长出来。

## 定义层与业务层

Style System 及其共享 values、selectors、declarations 才是定义层；整个组件 `.style.ts` 都是业务层。把 `value()` 写在组件文件顶部，不会使它成为定义层代码。

能够表达通用颜色、阴影、间距、交互状态或其他共享 feature 的定义，应先进入 Style System。只有无法取得足够通用语义的值才留在业务层；边界需要结合真实复用范围和表达质量判断，不能因为不存在机械分类规则，就默认所有值都属于组件。业务样式应主要选择已有定义和重定义 CSS Variable，代码量保持很小。

---

# 核心对象

| 对象 | 职责 |
| --- | --- |
| Condition | 描述相对于当前地址的 selector、状态、媒体条件或 At Rule 头。 |
| Condition Path | 由 Condition 组成的有序地址；嵌套时直接追加。 |
| CSS Property | 表达声明左侧的位置，包括普通属性、Custom Property 和 Descriptor。 |
| RawValue | 已不可继续拆解的原始值，当前是 `string` 或 `number`。 |
| Value | 原始值、随 Condition 取值的对象或复合表达；创建时不生成 CSS。 |
| Declaration | 保存 CSS Property 与 Value 的关系，以及必要的属性扩写语义。 |
| Rule | 一条 `[RuleAddress, RuleValue]` 配置。 |
| Rules | 按登记顺序保存 Rule 的内部 Map。 |
| Rule Handle | 控制一次 `rule()` 登记仍然有效的内容。 |
| Rules Handle | 删除一次 `rules()` 批量登记中仍然有效的条目。 |
| CSSRoot | 拥有源 Rules 账本，负责统一编译与宿主提交。 |
| CSS Compiler | 解读源 Rules 和派生 Rules，最终返回 CSS string。 |

Condition 同时有 `name` 和 `header`。`name` 是 Rule 合并、Value 取值与 Variable Key 共用的稳定名称；`header` 是生成 CSS 时写在花括号前的 selector 或 At Rule 文本。两个 Condition 可以使用同一个 name 而使用不同 header，表示同一取值名的 CSS 表达发生了变化：

```ts
const hover = condition('&:hover', 'hover')
const enabledHover = condition('&:hover:not(:disabled)', 'hover')
```

`value('red', [[enabledHover, 'blue']])` 仍以 `hover` 匹配取值与局部覆盖，生成 CSS 时则使用 `&:hover:not(:disabled)`。

`Rule` 是一条配置，不是容器；`Rules` 才是集合：

```ts
type RuleAddress = [
  ConditionPath | undefined,
  CSSProperty | undefined,
]

type Rule = [RuleAddress, RuleValue]
type Rules = Map<RuleAddress, RuleValue>
```

RuleAddress 固定为两项，两项都允许为空：

| 地址 | 语义 |
| --- | --- |
| `[path, property]` | 追加 path，并选择 property。 |
| `[path, undefined]` | 只追加 path，沿用当前 property。 |
| `[undefined, property]` | 保持当前 path，选择 property。 |
| `[undefined, undefined]` | 保持当前地址。 |

RuleValue 可以继续包含 Rules。编译器进入它时沿用上层地址，再按内部 RuleAddress 继续寻址。因此 CSS `@function` 的函数体、Keyframes 的帧和其他嵌套内容都使用同一个模型，不需要专用 Block。

---

# Rule 直接登记源配置

`rule()` 与 `rules()` 在 `.style.ts` 顶层直接调用，把配置按实际调用顺序写入 CSSRoot 内部源账本：

```ts
rule(button, colorKey, foregroundColor)

rules(button, [
  color(foregroundColor),
  backgroundColor(background),
])
```

`rule(condition, property, value)` 只登记一条 Rule。`rules(condition, declarations)` 接受 Declaration、`[CSSProperty, Value]` 与嵌套分组，先完整归一化和验证，再按输入顺序写入。整批输入无效时不留下部分登记，也不改变已有句柄的所有权。两者均不编译或操作 DOM。

同址后写覆盖前写，位置仍沿用该地址首次进入 Map 时的顺序。这就是普通 Map 更新的顺序语义；编译器不按 Path 深度、名称或输出长度重排。

`rule()` 返回句柄：

```ts
const appearance = rule(button, colorKey, foregroundColor)

appearance.replace(nextForegroundColor)
appearance.remove()
```

单项句柄可以替换仍由自己持有的值；批量句柄可以删除本次登记中仍由自己持有的条目。如果同址内容已经被后一次 `rule()` 覆盖，旧句柄不能替换或删除新的理解。句柄只修改源配置，不直接编译或操作 DOM。

源 Rules 是 CSSRoot 的内部状态，不从公共入口暴露。测试保存登记返回的句柄并在用例结束后删除，避免直接清空账本或建立业务侧配置容器。

---

# Value 在定义层保存各 Condition 对应的值

Value 只有两个基础概念：`Value` 与 `RawValue`。不再建立额外的状态值或单值类型与构造函数。

```ts
const foreground = value('red', [
  [whenHover, 'blue'],
  [whenActive, 'green'],
])
```

`value(default, conditions)` 保存 default 以及若干 Condition 对应的 Value。第二参数是 `[ConditionInput, ValueInput][]`，内部 `conditions` 字段直接保存 `[ConditionPath, ValueInput][]`。创建时不递归解包、字符串化或触发 `onActive`。普通 `value('red')` 也保留 Value 对象；编译给定 Condition Path 时才向下读取，直到得到 RawValue 或可由编译器降级的复合表达。

Condition 是机制，State 只是其中一种语义用法。hover、active、disabled 是常见例子，不限制 Value 的取值维度；媒体条件、Variant 或其他 Condition 也可以对应不同 Value。类型和编译器不分类或限制 State。

通用与业务由作者根据服务对象、复用范围和表达质量判断，不是两种 Condition 类型。定义层优先保存能够复用的完整 feature；业务层只保留确实依赖具体组件协议的选择。横跨多个属性的组件配方仍可用外层 Rule，但不能因此把本可通用的单属性取值矩阵留给组件重复表达。

```ts
const compact = condition('&[data-density="compact"]')
const spacing = value('12px', [
  [compact, '6px'],
  [media('(width > 800px)'), '16px'],
])
```

一个 feature 应在 Style System 的定义处保存各 Condition 对应的 Value，消费处只使用它：

```ts
export const foregroundColor = variable('fg', {
  fallback: value(defaultForegroundColor, [
    [whenHover, strongForegroundColor],
    [whenActive, strongForegroundColor],
  ]),
})

rules(button, [color(foregroundColor)])
```

这里的逻辑 CSS Variable 同时拥有 default、hover、active 等 Key。组件仍只消费 `foregroundColor`；各 Key 在落盘时取得独立的 Custom Property 名称，例如 `--fg`、`--fg-when-hover`、`--fg-when-active`。

## Variable 按已有 Key 局部重定义

`declareVariable(variable, input)` 不用 input 整体替换 Variable，而是先把 input 解释成 Value，再把它提供的 Key 投影到 Variable 已经拥有的 Key：

- RawValue 或不带 Condition 的 Value 只提供 default，因此只重定义基础 Custom Property。
- 带 Condition 的 Value 可以同时提供 default 与若干 Condition Key。
- 对象形式可以只提供 `hover`、`active` 等指定 Key；没有提供的 Key 保持原定义。
- input 提供、但 Variable 原定义中不存在的 Key 不参与输出。
- 只要匹配 Key 被明确提供，就生成定义；不比较新旧值是否相同。

```ts
declareVariable(backgroundColor, 'red')
// 只定义 --background-color。

declareVariable(backgroundColor, { hover: 'blue' })
// 只定义 --background-color-when-hover。

declareVariable(backgroundColor, value('red', [[active, 'green']]))
// 定义 --background-color 与 --background-color-when-active。
```

对象 Key 使用 Condition name；复合 Condition Path 按 name 顺序组成 Key。Condition 的 CSS header 可以演进，Variable 的匹配和派生名称仍由稳定 name 决定。

Variable 在值位置按当前 Condition 读取对应的派生 Custom Property，并以定义层 Value 中同 Key 的值作为 fallback。业务 Rule 因此只重定义需要变化的 Key，不重新创建一份状态 Value，也不重复声明消费该 feature 的 CSS Property。

## 按请求条件逐层读取

编译器对每个待生成的 Condition Path 执行同一规则：

1. 当前对象是 RawValue 时停止。
2. 当前 Value 存在同路径 Condition 时，读取对应 Value；否则读取 default。
3. 进入子 Value 后继续携带最初请求的 Condition Path。
4. 子 Value 仍按同路径 Condition 取值，没有则读取它的 default。
5. 同一个 Condition Path 重复定义时，取最后对应的 Value。

例如：

```ts
const blue = value('blue', [
  [whenHover, 'cyan'],
  [whenActive, 'navy'],
])

const foreground = value('red', [
  [whenHover, blue],
])
```

foreground 的 hover 最终得到 cyan；active 没有选择 blue，因此仍得到 red。读取 hover 对应 Value 时，不引入其中其他 Condition。

## 循环只按实际访问槽位判断

循环检测记录当前递归链正在访问的 `(Value 对象身份, 实际键)`：

- hover 与 active 是同一 Value 的两个不同槽位，可以分别读取。
- 一个 Value 被不同声明共享，前一次读取结束后不会污染下一次读取。
- 当前链再次进入完全相同的对象与实际键时，才判定为循环并停止编译。
- 请求的条件不存在而读取 default 时，实际键是 default；不能把外层请求键误记为已访问槽位。

访问结束后立即移出活动链。若以后增加已完成结果缓存，它也必须与活动链分开。

## 普通 Condition Path 不去重

按 Condition Path 读取 Value 不修改普通 Rule 的地址。外层 Rule 已有 hover，所选 Value 又产生 hover 时，结果可以是 `.Button:hover:hover`。这是合法 CSS，会增加 selector specificity；编译器不替用户删除重复 Condition。

## 复合值保留子 Value

calc、color-mix、shadow、transition、transform、animation 和列表都保存组成它们的子 Value。若不同子值分别拥有 hover 与 active，编译器会生成默认、单条件和交集结果；业务 selector 与媒体条件也使用同一机制。条件组合发生在 Value 读取阶段，不改变作者登记的 Rule Path。

## 通用状态与业务条件

`whenDisabled` 与 `whenHover`、`whenActive` 都是通用 Condition。禁用匹配原生 `:disabled` 或 UIKit 的 `[data-status~="disabled"]`；hover/active 反馈排除这两种禁用协议。

hover、active、disabled 等通用状态在 Style System 中定义为具有稳定 name 的 Condition。State 仍只是 Condition 的语义称呼，不增加 State 类型或构造函数。

loading、具体 Variant 或 Tone 是否足够通用，需要按真实服务对象判断。留在 Button 的业务条件只负责选择或重定义定义层 Variable；它不能在组件文件里复制 hover、active、disabled 的完整取值矩阵。若某个状态结果需要被特殊组合覆盖，业务 Rule 只重定义该 Variable 对应的 Condition Key。

Rules 也可以作为 Value 内容，用于需要继续携带 Property 或嵌套结构的场景。CSS `@function` 的完整函数体可以因此作为一个 Value 被按需挂载；编译器仍按相同的二项地址递归处理。

---

# `onActive` 只产生本次派生 Rules

Value 可以提供可选的 `onActive`：

```ts
interface ValueOptions {
  onActive?: (context: CompileContext) => Rules | Rules[] | undefined
}
```

创建 Value、登记 Rule 或只导入样式模块都不触发回调。`compileCSS()` 真正访问该 Value 时才触发；返回的 Rules 进入当前编译的派生集合，并继续接受同一套递归解读。

派生 Rules 不写回源 Rules。因此删除源 Value 后再编译，它曾带来的 `@property`、Keyframes 或 `@function` 会自然退出结果，不需要单独的停用阶段。

同一 Value 在一次编译中只激活一次，首次实际消费位置作为回调上下文。Rules 自引用和 Value 槽位循环都会终止并报错，不产生部分 CSS。

---

# `compileCSS()` 是唯一生成入口

公开生成操作只有：

```ts
const cssString = compileCSS()
```

它不接收业务侧 Rule 容器，也不返回中间树。内部步骤是：

1. 快照当前源 Rules。
2. 按登记顺序累计 Condition Path 与 CSS Property。
3. 解读 Declaration，统一展开需要静态扩写的属性。
4. 按请求条件解读 Value，并触发可达的 `onActive`。
5. 继续处理本次产生的派生 Rules，直到没有新的依赖。
6. 相同最终地址由后写内容覆盖，不调整地址原有顺序。
7. 根据连续 Condition Path 生长花括号，返回 CSS string。

Compiler 比 Formatter、Encoder 或 Decoder 更准确：这里不仅排版，还会解读高层对象、按 Condition 取值、触发依赖、扩写属性并降级为浏览器接受的 CSS。

---

# CSSRoot 账本与应用启动

CSSRoot 拥有源 Rules 账本和同址写入所有权。公开对象只提供无参 `cssRoot.mount()`；无参 `compileCSS()` 使用同一账本快照，只返回 CSS string。挂载先确认宿主存在，再编译，成功后提交到 `style#css-root`：

- 保留宿主原有前缀内容。
- 新结果与上次结果相同时不改写节点，现有 CSSOM 对象保持不变。
- 编译失败时不提交，宿主继续保留上一次成功结果。
- Rule Handle 更新源配置后，需要再次调用 `mount()` 才反映到 DOM；当前不建立自动订阅。

组件通过静态 `import './Button.style'` 保证样式模块执行。App 入口在静态依赖执行完毕后、`render()` 之前统一调用 `cssRoot.mount()`；组件渲染不触发编译。

```ts
import { cssRoot } from '@edsolater/uikit'
import App from './App'

cssRoot.mount()
render(() => <App />, root)
```

宿主由 App 的 HTML 提供 `<style id="css-root"></style>`。漏导入自身样式是组件封装问题；缺少宿主或启动挂载是 App 基础设施问题。服务器可调用 `compileCSS()`，不执行浏览器挂载。

静态 CSS 要求所有样式模块在首次挂载前完成登记。懒加载组件的样式由应用样式清单提前导入；不在组件渲染时补编译。当前 Example 静态导入全部 Example；Storybook 在 preview 提前导入 Button 样式，再统一挂载。打包配置保留 `.style.ts` 与产物 `.style.js` 的模块副作用。

---

# 验收条件

1. `Rule` 只表示一条配置，`Rules` 才表示集合；公共 API 不暴露源 Rules。
2. `.style.ts` 顶层使用单项 `rule()` 或批量 `rules()`；无效批次不产生部分写入。
3. 同址后写覆盖前写并保持 Map 顺序，旧句柄不能影响新的写入。
4. `Value` 与 `RawValue` 足以表达普通取值、各 Condition 对应的取值和复合值；不建立 State 专用分类。
5. `value()` 在定义时只保存结构，编译时按同键否则 default 的规则递归读取。
6. 循环检测区分同一 Value 在不同 Condition Path 下的实际访问，共享引用不会被误判。
7. 普通 Rule Path 不去重，合法的重复 selector 原样输出。
8. `onActive` 只向本次派生 Rules 添加可达依赖，不污染源 Rules。
9. CSSRoot 持有内部账本；`compileCSS()` 无参生成 CSS string，App 在渲染前无参挂载且原子提交。
10. Style System 定义层保存通用 feature 的 Condition Key；组件样式只选择定义并按已有 Key 重定义 Variable。
11. 一个逻辑 Variable 为每个 Condition Key 派生稳定 Custom Property；局部声明不替换未提供的 Key，也不新增原定义没有的 Key。
