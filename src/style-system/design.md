# Style System 2.0 设计

本文说明 Style System 2.0 已确定的对象模型和编译语义。样式名称的 namespace、语义层级与 CSS 实现边界见 [naming.md](naming.md)，当前文件职责见 [architecture.md](architecture.md)，组件样式写法见 [样式文件写法](../../docs/style/样式文件写法.md)。

# 设计目标

样式作者只表达“哪个地址拥有什么值”，不为最终 CSS 的花括号手工创建 Block：

- Condition Path 表达地址。
- `rule()` 登记一条源配置，`rules()` 按顺序批量登记，账本由 CSSRoot 持有。
- Declaration 与 Value 保存尚未展开的语义。
- `compileCSS()` 在执行时解读全部源配置，展开条件、属性和值，并返回 CSS string。
- CSS Variable、Keyframes 和 CSS `@function` 等依赖，只在编译器真正访问相应 Value 时进入本次结果。

Block、StyleRule、MediaRule 和 KeyframeRule 不再是对象模型。它们在最终 CSS 中的结构，都由 Condition Path 和编译规则生长出来。

## 定义层与业务层

Style System 及其共享 values、selectors、properties、mixins 是定义层；整个组件 `.style.ts` 是业务层。载体位置不能把一次性定义变成可复用抽象。

定义层提供业务无关、能脱离具体组件复用的材料、条件、CSS Key 和效果。判断范围是整个 UIKit 的多组件设计系统：像 `clickable()`、`boundary()`、`elevation()` 这样可与绑定组件解耦的目的，即使暂时只有一个消费者也可成为共享黑盒；Button 的 `solid` 配方和尺寸档位仍由 `.style.ts` 中的 Rule 选择材料，再交给通用 Mixin 翻译。是否共享不取决于当前调用次数，也不取决于抽出后的顶层代码是否更短。

---

# 核心对象

| 对象 | 职责 |
| --- | --- |
| Condition | 描述相对于当前地址的 selector、状态、媒体条件或 At Rule 头。 |
| Condition Path | 有序地址；挂载时验证 Value 的条件贡献，同址归一、异址拒绝。 |
| CSS Key | Declaration 的受体，包括普通属性、Variable 和 Descriptor；普通属性同时保存固定的内容语法。 |
| RawValue | 已不可继续拆解的原始值，当前是 `string` 或 `number`。 |
| Value | 原始值、随 Condition 取值的对象或复合表达；创建时不生成 CSS。 |
| Declaration | 已经匹配好的 Key 与可选 content；只保存这对关系，content 为 `undefined` 时整条声明无效。 |
| Rule | 一条 `[RuleAddress, RuleValue]` 配置。 |
| Rules | 按登记顺序保存 Rule 的内部 Map。 |
| Rule Handle | 控制一次 `rule()` 登记仍然有效的内容。 |
| Rules Handle | 删除一次 `rules()` 批量登记中仍然有效的条目。 |
| CSSRoot | 拥有源 Rules 账本，负责统一编译与宿主提交。 |
| CSS Compiler | 解读源 Rules 和派生 Rules，最终返回 CSS string。 |

Condition 只保存 `header`；它既是真实 CSS 条件，也是 Rule 合并与 Value 取值使用的地址身份。共享条件时直接复用同一个 Condition 变量，不在对象中复制一份字符串名称：

```ts
const hover = condition('&:hover')
const enabledHover = condition('&:hover:not(:disabled)')
```

两者的 CSS 生效范围不同，因此是不同地址。`value('red', [[enabledHover, 'blue']])`直接引用 `enabledHover`；需要在多处使用同一条件时继续引用这个变量。

`Rule` 是一条配置，不是容器；`Rules` 才是集合：

```ts
type RuleAddress = [
  ConditionPath | undefined,
  CSSKey | undefined,
]

type Rule = [RuleAddress, RuleValue]
type Rules = Map<RuleAddress, RuleValue>
```

RuleAddress 固定为两项，两项都允许为空：

| 地址 | 语义 |
| --- | --- |
| `[path, key]` | 追加 path，并选择 key。 |
| `[path, undefined]` | 只追加 path，沿用当前 key。 |
| `[undefined, key]` | 保持当前 path，选择 key。 |
| `[undefined, undefined]` | 保持当前地址。 |

RuleValue 可以继续包含 Rules。编译器进入它时沿用上层地址，再按内部 RuleAddress 继续寻址。因此 CSS `@function` 的函数体、Keyframes 的帧和其他嵌套内容都使用同一个模型，不需要专用 Block。

---

# Rule 直接登记源配置

`rule()` 与 `rules()` 在 `.style.ts` 顶层直接调用，把配置按实际调用顺序写入 CSSRoot 内部源账本：

```ts
rule(button, $color, foreground)

rules(button, [
  [$color, foreground],
  [$backgroundColor, actionSurface],
])
```

`rule(condition, key, value)` 只登记一条 Rule。`rules(condition, declarations)` 接受声明二元数组、嵌套分组与表示“本层没有声明”的 `undefined`，先完整归一化和验证，再按输入顺序写入。整批输入无效时不留下部分登记，也不改变已有句柄的所有权。两者均不编译或操作 DOM。

Declaration 的结构就是 `[key, content]`。`declare(key, content)` 只返回同一个二元数组，作者可以按上下文决定是否使用。普通属性 Key、Variable 和 Descriptor 都直接充当受体；一个内容直接放在第二项，多个有序内容放进第二项内部的数组：

```ts
[$borderRadius, pill]
[$gap, normalSpace]
[$padding, [normalSpace, wideSpace]]
[$transition, [
  [$backgroundColor, fast, standard],
  [$color, fast, standard],
]]
```

`rules()` 递归展开声明组合和 Mixin 返回值，跳过任意层级的独立 `undefined`；遇到以 CSS Key 开始的二元数组就停止，content 即使是数组也整体保留。Declaration 的 content 为 `undefined` 时整条声明同样被跳过。Key 自己保存其内容的固定编译语法；编译器到执行阶段才按 Key 解读有效 content。

源账本同址后写覆盖前写，位置沿用该地址首次进入 Map 的顺序。最终 CSS 记录的父子关系由挂载阶段建立，见下文 [有序 CSS 记录](#有序-css-记录)。

`rule()` 返回句柄：

```ts
const appearance = rule(button, $color, foreground)

appearance.replace(nextForeground)
appearance.remove()
```

单项句柄可以替换仍由自己持有的值；批量句柄可以删除本次登记中仍由自己持有的条目。如果同址内容已经被后一次 `rule()` 覆盖，旧句柄不能替换或删除新的理解。句柄只修改源配置，不直接编译或操作 DOM。

源 Rules 是 CSSRoot 的内部状态，不从公共入口暴露。测试保存登记返回的句柄并在用例结束后删除，避免直接清空账本或建立业务侧配置容器。

## Mixin 表达效果

Mixin 是返回 Declaration 组合的完整效果。它不绑定具体组件，并拥有“语义配置怎样翻译为 CSS Key”的关系。省略配置产生 content 为 `undefined` 的 Declaration，由 `rules()` 跳过，不重置其他 Rule。

判断参数化 Mixin 时，去掉组件名称并把材料换成参数：剩余关系仍是完整目的，而且目的扩展时所有调用者都应共同获得，边界成立。只转发另一个 Mixin、逐项复刻 CSS Key 或必须查看实现才能理解的函数，都不是黑盒。

Mixin 的文件归属见 [architecture.md／文件职责](architecture.md#文件职责)，组件使用方法见 [样式文件写法／Mixin 赋予效果](../../docs/style/样式文件写法.md#mixin-赋予效果)。

---

# Value 表达内容

Value 只有两个基础概念：`Value` 与 `RawValue`。不再建立额外的状态值或单值类型与构造函数。

```ts
const foreground = value('red', [
  [whenHover, 'blue'],
  [whenActive, 'green'],
])
```

`value(default, conditions)` 保存 default 以及若干 Condition 对应的 Value。第二参数是 `[ConditionInput, ValueInput][]`，内部 `conditions` 字段直接保存 `[ConditionPath, ValueInput][]`。创建时不递归解包、字符串化或触发 `onActive`。普通 `value('red')` 也保留 Value 对象；编译给定 Condition Path 时才向下读取，直到得到 RawValue 或可由编译器降级的复合表达。

Condition 是机制，State 只是其中一种语义用法。hover、active、disabled 是常见例子，不限制 Value 的取值维度；媒体条件、Variant 或其他 Condition 也可以对应不同 Value。类型和编译器不分类或限制 State。

通用与业务由服务对象决定，不是两种 Condition 类型。共享材料保存自身语义所需的条件取值；组件特有的一次性配方直接由 Rule 表达，不为缩短调用处而建立具名私有 Value。通用效果的实现 Value 由 Mixin 封装，不向业务暴露一组只有实现含义的原始槽位。

```ts
const compact = condition('&[data-density="compact"]')
const spacing = value('12px', [
  [compact, '6px'],
  [media('(width > 800px)'), '16px'],
])
```

一个共享材料可以把属于自身语义的 Condition 取值保存在定义处：

```ts
export const interactiveSurface = variable('color-surface-interactive', {
  fallback: value(lowSurface, [
    [whenHover, hoverSurface],
    [whenActive, activeSurface],
  ]),
})

rules(button, [[$backgroundColor, interactiveSurface]])
```

这里 `interactiveSurface` 表达可交互的承载面，而不是 `background-color` 的镜像名称。`$backgroundColor` 已经说明 CSS 实现位置，Value 只补充该位置要放入的语义内容。

## Variable 在各条件下改写同一个值

Variable 始终对应同名 Custom Property。它作为 Value 被消费时只输出一个 `var(--name, fallback)`，条件分支改变该变量的赋值，不展开消费它的 CSS Function。

动态 fallback 在实际消费地址生成 default 与条件赋值；静态 fallback 只留在 `var()` 内。条件默认值与显式声明都进入同一挂载器，同一地址的显式声明优先，与解析先后无关。不同消费地址分别得到自己的条件默认值。

`[variable, input]` 可以用完整 Value 同时修改 default 与条件分支，也可以用条目数组只修改指定地址。未声明的地址保留默认定义；允许增加 fallback 中没有的条件。

```ts
const exampleBackground = variable('color-background-example', {
  fallback: value('white', [[hover, 'gray'], [active, 'silver']]),
})

[exampleBackground, 'red']
// 只定义 --color-background-example。

[exampleBackground, [[hover, 'blue']]]
// 在 hover 下写入 --color-background-example: blue。

[exampleBackground, value('red', [[active, 'green']])]
// 默认写入 red，active 时向同一个变量写入 green。
```

Variable 表达独立可赋值的输入，不为普通 CSS 属性预先建立同名槽位。Button 的中性表面占比属于 Button，因此其 Variable 配方留在 Button；共享的仍是编译机制。

## 从 Rule 地址向叶子展开

编译先取得 Rule 地址，再逐层进入 Value 与 CSS Function。每个动态 Value 提供自己的 default 与条件分支；Function 解析全部子值组合，并保留每个 Value 的条件贡献。嵌套 Function 不建立新的条件作用域。

- RawValue 与无条件的 Value 不增加条件贡献。
- 动态 Value 的 default 是真实贡献，解析结果以空路径保留，交给挂载器时降级为 `undefined`；验证前不能删除。
- 挂载阶段验证完整候选：default 与 default、hover 与 hover、active 与 active 同址归一。
- default 与 hover、default 与 active、hover 与 active 不同址，候选挂载失败，记录数组保持原样。CSS Function 不判断这些冲突。
- 路径身份由完整 `header` 序列决定；重复分支最后一次定义生效。

例如两个子 Value 都有 default、hover、active，先形成九个候选，挂载后留下三条。同一函数的两个子 Value 分别只有 default/hover 与 default/active 时，先形成四个候选，挂载后只留下 default。

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

foreground 的 default 得到 red，hover 得到 cyan；不会进入 blue 的 active 分支。

## 循环检查覆盖全部候选

循环检测记录当前递归链中的 Value 对象。再次进入同一对象时停止编译并报错；访问完成立即退出活动链，因此不同参数、分支和声明共享同一 Value 不会误报。

解析必须形成全部候选，所以最终因条件冲突而无法挂载的候选也会接受循环检查，不能通过提前剪枝隐藏循环。

## 普通 Condition Path 不去重

按 Condition Path 读取 Value 不修改普通 Rule 的地址。外层 Rule 已有 hover，所选 Value 又产生 hover 时，结果可以是 `.Button:hover:hover`。这是合法 CSS，会增加 selector specificity；编译器不替用户删除重复 Condition。

## 复合值保留子 Value

calc、color-mix、shadow、transition、transform、animation 和列表都保存子 Value，由同一套完整候选解析机制编译。各函数只负责最终 CSS 语法，不裁决条件冲突。

`colorMix([color, ratio], otherColor)` 的比例也接受 Value 或 Variable。数字 `0.82` 在编译时成为 `82%`；Variable 比例成为 `calc(var(--ratio, 0.82) * 100%)`，由浏览器使用当前变量值计算。业务构造阶段不做数值换算。

## 通用状态与业务条件

`whenFocus`、`whenFocusWithin`、`whenFocusVisible`、`whenDisabled`、`whenHover` 与 `whenActive` 都是通用 Condition。禁用匹配原生 `:disabled` 或 UIKit 的 `[data-status~="disabled"]`；hover/active 反馈排除这两种禁用协议。

hover、active、disabled 等通用状态在 Style System 中定义为可直接引用的 Condition。State 仍只是 Condition 的语义称呼，不增加 State 类型或构造函数。

通用状态只提供可复用的 Condition 身份，不决定每个组件的视觉结果。`clickable()` 等通用 Mixin 可以拥有自己的 active 与 disabled 反馈；Button 的 variant、tone 和 size 配方则留在 `Button.style.ts`。只在某个 Value 或 Variable 本身就表达可复用材料时，才把它的条件取值提升到定义层。

Rules 也可以作为 Value 内容，用于需要继续携带 Key 或嵌套结构的场景。CSS `@function` 的完整函数体可以因此作为一个 Value 被按需挂载；编译器仍按相同的二项地址递归处理。

---

# `onActive` 只产生本次派生 Rules

Value 可以提供可选的 `onActive`：

```ts
interface ValueOptions {
  onActive?: (context: CompileContext) => Rules | Rules[] | undefined
}
```

创建 Value、登记 Rule 或只导入样式模块都不触发回调。`compileCSS()` 解析访问该 Value 时触发；返回的 Rules 进入当前编译的派生集合，并继续接受同一套递归解读。完整候选中的依赖都会被访问，即使对应声明最终因条件冲突而未挂载。

派生 Rules 不写回源 Rules。因此删除源 Value 后再编译，它曾带来的 `@property`、Keyframes 或 `@function` 会自然退出结果，不需要单独的停用阶段。

同一 Value 在一次编译中只激活一次，首次解析位置作为回调上下文。Rules 自引用和 Value 递归引用都会终止并报错，不产生部分 CSS。

## 有序 CSS 记录

内部记录使用普通可变三元组数组：

```ts
type CSSRecord = [conditions: (string | undefined)[], key: string | undefined, css: string]
```

Condition 与 CSS Key 在进入记录前降级为字符串；不存 Value、owner 或节点对象。树只由 conditions 的前缀关系表达。

挂载完整候选时先验证所有条件贡献，无效候选不改变数组；default 验证通过后投影到当前节点。有效记录直接插入所属区域：

- 同 Path、同 Key 原位覆盖；同 Path 的不同 Key 连续共存。
- 父节点声明先于全部后代；每个子树只占一段连续区域。
- 兄弟子树保持首次挂载顺序；向已有 hover 添加声明时进入原 hover 区域。
- 条件变量默认值与显式声明共用这些规则，显式同址优先。
- 具名 `@function`、`@keyframes`、`@property` 按主体整体替换，旧子树退出，新主体保留原兄弟位置。

数组在挂载过程中形成规范顺序，不在末尾排序或重新分组。字符串函数只接收这份数组，比较相邻路径的公共前缀，打开或关闭块，再写入属性与内容；它不处理值解析、条件冲突、覆盖或所有权。

---

# `compileCSS()` 是唯一生成入口

公开生成操作只有：

```ts
const cssString = compileCSS()
```

它不接收业务侧 Rule 容器，也不返回中间树。源账本快照进入两个内部步骤：

1. `resolveRules()` 解析 Rules、Value、Variable、CSS Function 与依赖，把有效候选挂载为有序记录数组。
2. `stringifyCSS()` 线性读取完整数组，返回 CSS string。

这两个边界仅供编译器内部使用和测试，不从 Style System 公共入口导出。

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

静态 CSS 要求所有样式模块在首次挂载前完成登记；各应用入口与打包配置怎样满足这项约束，见 [architecture.md／Button 接入](architecture.md#button-接入)。

---

# 验收条件

1. `Rule` 只表示一条配置，`Rules` 才表示集合；公共 API 不暴露源 Rules。
2. `.style.ts` 顶层使用单项 `rule()` 或批量 `rules()`；声明统一为 `[key, content]`，`declare()` 只返回相同二元数组，无效批次不产生部分写入。
3. 同址后写覆盖前写并保持 Map 顺序，旧句柄不能影响新的写入。
4. `Value` 与 `RawValue` 足以表达普通取值、各 Condition 对应的取值和复合值；不建立 State 专用分类。
5. Value 与 CSS Function 在定义时只保存结构；解析保留全部组合，挂载时同址归一、异址原子拒绝。
6. 循环检查覆盖全部候选；共享引用不会被误判。
7. 普通 Rule Path 不去重，合法的重复 selector 原样输出。
8. `onActive` 只向本次派生 Rules 添加可达依赖，不污染源 Rules。
9. CSSRoot 持有内部账本；`compileCSS()` 无参生成 CSS string，App 在渲染前无参挂载且原子提交。
10. Style System 定义层提供业务无关的材料、Condition、CSS Key 和 Mixin；组件特有效果直接留在自己的 `.style.ts`。
11. Mixin 以完整效果为语义单位，不按单个 CSS Key 机械拆分，也不与具体业务组件绑定。
12. Variable 表达独立语义输入；不同条件修改同名 Custom Property，不展开消费表达式，不派生条件变量名。
13. 抽象后若仍需查看实现才能理解业务，该抽象必须回到直接 Rule；不用顶层行数代替理解链验收。
