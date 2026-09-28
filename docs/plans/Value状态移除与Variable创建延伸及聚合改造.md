# Value 状态移除与 Variable 创建、延伸及聚合改造 Plan

当前成员状态继承由 `clusterFrom` 承担；下文的单 Variable 延伸保留为当时实施记录。现役契约见 [Variable](../../src/style-system/doc/变量定义与消费.md)。

后续裁决：本 Plan 的阶段记录保留；Cluster 同名匹配、focus 状态及自动状态交集的后续实施，以 [Variable Cluster 整组赋值与 focus 状态归属修正 Plan](VariableCluster整组赋值与Focus状态归属修正.md) 为准。旧完整匹配与 action 补齐选择已撤回。

## 要改成什么

第一层要让业务样式直接使用有完整行为的 Variable，状态和配方由定义端处理。使用者选好材料以后，不需要再拆开材料、读取内部状态或者手写通用反馈。

本次改造分成三件事：

1. **Value 只表达值，移除它的状态配置和扩散能力。**
2. **Variable 负责状态，支持通过配置创建、从已有 Variable 延伸。**
3. **Variable Cluster 聚合 Variable，用参数选择成员，也能直接作为 Variable 使用。**

这三项来自用户已经明确的设计，下面的 API 说明整理这些约定。“实施顺序”和“怎样验收”是落实约定的工作安排。

2026-09-21 验收重开：Cluster 同名成员整组声明与定义端焦点职责已实现，正在独立复审与完整验证。下列 141 项单元、66 项浏览器与构建结果属于追加裁决前的阶段历史，不代表新要求的最终验收结果。

同时落实两项使用端要求：所有定义放在首次使用之前；rules 的公开输入统一为声明元组及 Mixin 组合，不再接受普通声明对象或裸字符串属性键。

### 本轮验收记录

- **修复：** 首次在外层 hover 内引用 inner 时，原实现会把 inner 的 10px 常态写成 20px，随后同址普通消费仍被污染。Variable 自动定义现保留递归消费的完整状态条件，同变量、同普通地址内按状态顺序填回原槽位；常态恢复 10px，hover 为 20px，其他地址与显式规则顺序保留。单元与浏览器回归覆盖两种消费顺序、状态反序发现、来源链及状态交集。公开声明类型、材料定义顺序、测试名称与契约注释同步收口，底层对象解析保留。
- **完整验证：** 类型检查退出码 0（2.132 秒）；单元测试 32 文件、141 项通过（2.828 秒）；浏览器测试 13 文件、66 项通过（8.956 秒）；生产构建退出码 0（2.645 秒）。Terra 验证前后 253 份选定源码／配置的 SHA256 相同；原始结果见[验证摘要](C:/Users/edsol/AppData/Local/Temp/uikit-execution-verification-final-20260921-c801bf374b5c48168d369a7891924720/summary.json)。
- **阶段历史中的保留判断：** Variable 自身状态交集、动态 number 缺失成员运行时报错、没有生产消费者的通用材料暂留，其理由与代价在交付中解释；逐项绑定 toneColor 四成员的旧判断已被整组声明裁决覆盖。
- **核验边界：** 本轮未读取 Git 完整差异，因此不声称历史旁改已全部排除；本记录只确认实际审查、修复与验证范围，不改写下文设计和实施顺序。

## 一、Value 只负责表达值

Value 保留表达和组合内容的能力，去掉 State Condition，以及将内部状态带到外部表达式、继续展开组合的能力。

例如，原来通过 `value(surfaceColor, { hover: …, active: … })` 表达的状态变化，需要移到 Variable 的定义或延伸中。不能只删除分支而丢失效果，也不能仍让内部 Value 处理状态、外面只包一层 Variable。

颜色、尺寸、透明度等内容都按同一条边界处理：稳定内容用 Value，需要自身状态适配的材料用 Variable。组合中使用了 Variable，不代表外围 Value 也获得了它的状态分支。

**完成后的结果：Value 不选择状态、不扩散状态；需要变化的 Variable 自己处理状态，使用者直接使用它。**

## 二、Variable 支持创建与延伸

### 创建一个 Variable

```ts
variable(source, {
  name: 'surface-color',
  states: {
    hover: hoverColor,
    active: source => colorMix([source, 0.48], neutralColor(2)),
  },
})
```

这里的颜色和比例只演示接口，不规定 Theme 配方。

| 输入 | 表达什么 |
| --- | --- |
| 第一个参数 `source` | 创建所用的值。它是什么对象或值，状态回调就收到什么，类型也随输入保留 |
| `name` | 创建出的 Variable 的名字，供最终 CSS 变量命名使用；对应原来的 `Variable.name` |
| `states` | 可选的状态配置。键是 State Condition，内容既可以直接指定，也可以用接收 source 的回调产生 |

State Condition 描述主体自身状态，例如 hover、active、disabled、focusVisible。它承接原来 Subject Condition 的命名与状态职责，不表示语气。原 Value 中确实需要的状态适配迁到这里。

首参数不再是旧接口中的名字，名字放入配置。定义 API 不增加 `defaultValue` 字段；`fallback` 的语义在最终转换 CSS 字符串时处理，不用 CSS 输出形态反过来规定定义 API。

### Variable 名字以存在形式结尾

名字的最后一个单词说明这个 Variable 以什么形式存在，让使用者能想象它代表的东西。前面的词说明用途或对象，最后的词说明形式。

例如，`surfaceColor`、`backgroundColor` 以 Color 结尾，表示颜色；`controlSize` 以 Size 结尾，表示尺寸；`boundaryWidth` 以 Width 结尾，表示宽度。这里的“形式”不是要求所有名字都加字面上的 Unit，也不是要求把 px 等 CSS 单位写进名字。

示例中的 `name` 同样表达这个含义，如 `surface-color`、`button-surface-color`。Cluster 及其成员作为 Variable 命名时也保持这个可想象性；选择参数仍是 soft、strong 等成员键，无需把参数改成完整 Variable 名字。

### 从已有 Variable 延伸

```ts
variableFrom(surfaceColor, {
  name: 'button-surface-color',
  states: {
    active: source => colorMix([source, 0.48], neutralColor(2)),
  },
})
```

`variableFrom` 创建新 Variable，保存来源引用和自身配置，通过引用链取得未定义的内容：

- `source` 是传入的 `surfaceColor` 对象。
- 新名字属于新对象，来源 Variable 的名字保持不变。
- 自身定义了某个状态，就使用自己的内容；没有定义，就沿来源引用链查找。
- 不复制来源定义，也不修改来源对象。继续延伸时仍按同样的规则逐层查找。

例如，上面的新 Variable 自己定义了 active，就使用自己的 active 内容；没有定义 hover，就交给 `surfaceColor` 处理 hover。若来源也是延伸得到的 Variable，查找继续沿它的来源进行。有效的值（例如 `0`）不能被当成“没有定义”。

**Variable 定义完成后是黑盒。** 回调直接把 `source` 当值使用。在上面的 active 内容中，来源 Variable 自动使用自己在 active 状态下成立的值参与计算。调用者不需要读取内部状态，也不需要自己取出 active 值。

“回调收到原对象”和“使用时按状态取得值”同时成立：前者规定传入什么，后者属于 Variable 自己的行为。普通 Value 不因此获得状态能力。

延伸创造新的定义；业务规则中的 CSS 声明则交给浏览器处理。两者不能混淆，声明操作不会修改共享 Variable 对象。

### 本项需要解决的实现问题

现有 `core/css-variable.ts` 的部分定义放在 `onActive` 闭包里，闭包引用创建时的名字和对象。延伸需要由新对象保存自己的名字及配置，并接上来源引用；不能直接把来源的声明函数当作新对象的声明函数。

实施时按“自身定义优先，没有则沿来源查找”解析内容，并由新 Variable 产生自己的声明。引用链和配置保存在内部，不能因此向使用者开放内部字段。

### 混色内容与状态回调怎样区分

`colorMix(...)` 返回一个可识别、同时可调用的对象。对象提供 `serializeCSS` 输出入口，使编译器能识别它是已经构造好的混色内容。这里的入口名称沿用讨论示意；具体参数以及对象直接调用时的行为尚未确定。

```ts
const mixedColor = colorMix(accentColor('soft'), neutralColor(2))

states: {
  hover: mixedColor,
  active: source => colorMix([source, 0.48], neutralColor(2)),
}
```

hover 直接提供混色对象，识别后保留为内容，在 CSS 输出阶段通过其输出入口生成文本。active 是普通状态回调，传入 source 后得到混色对象，再按同一内容协议处理。不能仅凭“是不是函数”判断用途，要先识别内容对象，再处理普通回调。

这解决了当前 colorMix 返回普通函数、与状态回调形状相同的问题。`serializeCSS` 是内容对象的输出能力，不是给使用者增加一轮独立的 CSS 编译步骤，也不让 Value 获得状态扩散能力。本次只接入已确认的可识别对象协议，不自行扩展其他计算行为。

## 三、Variable Cluster 统一表达成员选择

用对象声明成员，每个属性的值都是 Variable，`default` 指定 Cluster 直接使用时代表的成员：

```ts
const accentColor = variableCluster({
  default: variable0,
  soft: variable1,
  strong: variable2,
})
```

这里的 variable0、variable1、variable2 只是示例中已有 Variable 的名字，不表示公开的等级编号。构造函数接收成员配置对象，不接收选择函数。

使用方式：

```ts
accentColor          // Cluster 直接作为 Variable 使用
accentColor('soft')  // 选择 soft 成员，结果仍是 Variable
neutralColor(2)      // 用数字选择成员，结果仍是 Variable
```

Cluster 返回特殊的黑盒对象，它本身也是 Variable。直接使用 `accentColor`，表现为配置中的 `default` Variable；调用 `accentColor('soft')`，返回配置中的 `soft` Variable；`strong` 同理。参数是声明的成员键，不统一命名或解释成 level。像 `neutralColor(2)` 这样的数字选择也对应成员键，不把所有成员都设计成数字等级。

`accentColor('soft')` 将语气选择收在 Cluster 中，不再要求使用者通过独立的 `softAccent`、`strongAccent` 入口认识同一组材料。成员配置属于定义阶段；使用者只使用 Cluster 或调用选择成员，不读取 Variable 的内部状态或配置。

用户用“代理 default，再增加调用选择能力”说明对象关系。实现必须满足这个对外行为；Proxy 的具体写法属于内部实现。JavaScript 中普通对象仅加 apply 陷阱不会变得可调用，需要使用可调用的代理目标或等效机制，不能把类比代码直接作为可运行实现。这个限制不改变成员配置 API，也不要求暴露内部结构。

**成员选择与成员状态分开。** 选中 soft 成员后，它仍然是一个黑盒 Variable，拥有自己的状态。active 时使用这个成员在 active 下成立的值，不是把它切换成另一种语气。

Cluster 可以聚合基础颜色，也可以聚合通用语义颜色；不因现在只有 Button 使用就变成 Button 专属设计。原始 Variable 和延伸得到的 Variable 都属于可聚合的材料，不另建一套延伸材料体系。

### 整组声明

目标和内容都是 Cluster 时，`[toneColor, accentColor]` 按同名成员生成整组 Variable 声明，包括 default、soft、strong、foreground、line。普通值消费仍取 default，调用仍选择成员；普通 Variable 目标接收 Cluster 内容时也只取 default。

最新裁决只配对双方已有的同名键；未匹配目标不增加声明，保留原有默认值或作用域覆盖，来源额外键不参与。缺少成员不报错；下述冲突检查只针对实际匹配项。多个成员只有目标对象与来源对象分别相同才合为一条声明；不同目标对象同名、同一目标对应不同来源都拒绝。成员赋给自身不输出，不同对象的目标与来源同名则报错，避免 CSS 自循环。这些冲突裁决仅约束整组入口。只展开一层，局部覆盖交给 CSS，不深度合并、不改共享 JS，也不公开成员反射接口。

编译器负责展开，登记账本保留原对象，以覆盖普通 rules、单条 rule、句柄替换和直接编译的同一条路径。Button 的 solid／accent／danger 分支采用整组 tone 声明，焦点配色随 line 成员一起绑定。

### 追加的焦点职责要求与实现

Focus 属于 State Condition，优先级低于 hover／active。定义端状态能力与通用 Mixin 必须承担焦点，Button 不得写 `[focusColor, accentColor('focus')]`、`[focusColor, dangerColor('line')]` 或映射另一套焦点成员。保留现有 `:focus-visible` 的显示条件及视觉，不把它替换为 `:focus`，也不能为了轮廓颜色让背景、前景在 focus 时一起变色。

最新裁决撤回为完整匹配而补造的 action soft／strong，包括 14% 混色和 strong 基色别名。action 只保留 default、foreground、line；tone 的 soft／strong 未匹配时不增加声明，不要求补齐配色，也不新增 Theme token。

accent 的 focus 成员统一为 line，仍使用原 `--color-accent-focus` 色值；tone 增加 line，danger／action 保留原 line 材料。focusOutline 通过 states.focus 匹配 `:focus-visible` 并消费 tone line，通用 clickable 输出轮廓及偏移；独立 focusColor 角色和 Button 的焦点绑定删除。solid 选择 `[toneColor, actionColor]`，后续 accent／danger 整组声明覆盖，组件无需另选焦点效果。

当前 Button 的无 tone solid 仍直接使用原 action 背景／前景配方；带 tone 时整组被 accent／danger 覆盖，撤回补造成员不改变这些配方。浏览器定向验证覆盖明暗主题九种配方的常态、独立焦点、hover、active 及其交集；另用同一 Variable 的 focus／hover／active 状态验证优先级，实际触发 `:focus-visible`，并区分鼠标原生焦点与可见焦点。

## 定义放哪里，Button 要简化到什么程度

整个 Style System 都是抽象层，其中可以有面向基础细节的材料，也可以有面向组件的通用材料。当前具体业务样式在 `Button.style.ts`。

抽象层可以定义 surface 及其通用行为，Button 可以在自己的定义中延伸它，声明 Button 所需的差异。不能把 Button 专属身份放进抽象层，也不能让 Button 重新手写通用的混色、状态和焦点反馈细节。

通用抽象按描述目标和所属领域判断，不按当前消费者判断。如果不用业务名字也能准确、自然地说明它是什么，其他组件使用它也不别扭，才适合作为通用抽象。如果它描述的就是某个具体组件，脱离该组件的领域就难以成立，便属于该组件自己的业务定义。

例如，`surfaceColor` 描述承载面的颜色，被 Button 使用不会让它变成 Button 专属；`buttonSurfaceColor` 描述 Button 自己的承载面颜色，属于 Button。判断的是含义，不能仅把名字里的 button 删掉，就把同一份组件专属定义搬进抽象层。

Theme 负责配方，必要重复允许保留。当前不建设通用调配器，也不为了减少重复而增加使用者必须理解的新分类。focusVisible 属于 State Condition，通用焦点反馈需要在定义端接好，Button 不负责逐项协调线宽、线型、偏移和状态规则。

具体哪个 Mixin 组合焦点反馈，由 Mixin 自己的职责与设计决定。本次 Variable 改造提供状态能力并接管已有需求，不把“clickable 是否默认包含焦点反馈”列成 Variable 设计的前置选择，也不借此重新设计 Mixin。

判断整个方案是否更好，要看一条完整使用路径：定义材料、选择或延伸材料、交给业务样式使用。不能只看某个文件变短，或者测试能通过。

## 实施顺序

### 样式文件按使用顺序阅读

所有定义一视同仁，放在首次使用之前，定义完紧接着使用，不在文件开头先集中堆放。默认样式的材料紧靠首次消费它的默认规则，solid 的材料紧靠首次消费它的 solid 规则，loading 的材料紧靠首次消费它的 loading 规则。

```ts
const loadingCursor = variable('progress', {
  name: 'button-loading-cursor',
  states: { disabled: 'not-allowed' },
})

rules([...button, '&[data-status~="loading"]'], [
  [$cursor, loadingCursor],
])
```

被多处使用的定义也放在首次使用之前，后面继续复用，不重复创建，不设“通用定义集中放置”的例外。定义属于哪个模块，由上面的描述目标与领域判断；模块归属和模块内的阅读顺序分别处理。

### rules 只公开一种声明输入方式

rules 接收声明序列，直接声明使用 `[Key, 内容]` 或 `[Variable, 内容]`，也可以组合 Mixin 返回的声明：

```ts
rules(button, [
  [$alignSelf, 'center'],
  [$opacity, buttonOpacity],
  [surfaceColor, buttonSurfaceColor],
  color({ background: surfaceColor }),
])
```

不再接受 `rules(button, { opacity: buttonOpacity })`，也不以 `['opacity', buttonOpacity]` 绕回字符串属性入口。属性目标直接使用 `$opacity` 等 Key 对象，无需预先注册 background、opacity 等字符串名称来查找 Key。这里限制的是声明的键；`'center'` 这样的内容字符串、选择器和状态名称不受影响。Mixin 自己的配置对象（如 `color({ background: … })`）仍由 Mixin 接收，不属于要取消的 rules 声明对象。

本次在公开输入类型中取消这些写法，迁移调用、示例及类型测试。底层已有对象解析或字符串处理实现不要求随之删除，也不新增运行时禁止逻辑。检查当前 `Declarations`、`DeclarationItem` 及声明目标类型，确保公开签名不会通过其他联合分支继续接受旧写法；内部处理类型按实际需要保留。Key 对象的直接使用路径不依赖全量名称预注册，本项不等于要求删除所有内部登记或 CSS Variable 注册能力。

### 1. 确认状态需求由谁接管

检查整个 Style System 及 Button 的实际使用，列出依赖 Value 状态的内容，并区分稳定值、需要状态的 Variable、需要聚合的成员。每项变化都要有明确接收方，不能直接删除效果。

同时检查文件职责与调用链。代码拆分围绕下面三项改造一起进行；不按文件长度拆，也不顺带修理无关工具。

### 2. 接好 Variable 的创建、延伸和状态解析

在 Variable 核心及编译路径实现配置创建、引用链延伸、状态回调和黑盒取值。先验证 source 的身份与类型、自身定义优先及沿链查找、来源不被修改、新名字输出正确，再迁移实际材料。

不要为了延伸引入一个要求调用者读取内部定义的 API。

### 3. 移走 Value 的状态职责

将实际状态需求迁入 Variable，删除 Value 状态入口及编译中的状态扩散路径。保留稳定内容组合所需的能力，检查状态优先级和已有交互效果是否被正确接管。

将 colorMix 接入上文确认的可识别、可调用对象协议，避免把混色内容当成 source 回调执行。除此之外，CSS function 的计算方式不在本次自行扩展。

### 4. 接入 Cluster，整理材料与 Button 消费

实现 `variableCluster({ default, soft, strong })` 这样的成员声明，以及返回对象的直接使用和调用选择。接入基础色与通用语义材料，用 `accentColor('soft')` 这类调用验证表达。成员使用同一套 Variable 能力。

再检查 Button 是否只需声明自身差异和使用目的。所有定义移到首次使用之前；将 rules 对象声明和字符串属性键改为 Key／Variable 元组，收紧公开输入类型。若仍要业务协调通用状态或读取内部结构，说明责任还没有放对，不能以改名或搬文件结束。

### 5. 验收整体，再检查有没有多改

完成下面的运行验证，同时检查类型、模块与公共 API 是否让使用路径更清楚。无法对应本次目标的修改应退出本次范围。

## 主要代码落点

| 位置 | 需要承担的改动 |
| --- | --- |
| `src/style-system/core/css-value.ts`、`compiler/compile-value.ts` | 移除 Value 状态配置与扩散，保留稳定值的表达和组合 |
| `src/style-system/core/css-variable.ts`、`compiler/compile-variable.ts` | 创建配置、引用链延伸、状态解析和最终 CSS 输出；自身定义优先，缺失时沿来源查找，内部结构不向使用者泄露 |
| `src/style-system/values/functions/color-mix.ts`、内容协议及其编译入口 | 返回可识别且可调用的混色对象，接入 CSS 输出能力，和普通状态回调分别处理 |
| Style System 的 Cluster 实现及导出入口 | 聚合 Variable，支持选择成员和直接使用；具体文件划分根据职责确定 |
| `src/style-system/materials/state-conditions.ts` 及状态调用方 | 统一 State Condition 名称，保留主体状态含义 |
| `core/css-rule.ts`、`compiler/compile-css.ts` | 让新 Variable / Cluster 正确参与声明与消费，保持对象关系直到需要输出 |
| `core/css-rule.ts`、`core/css-declaration.ts`、`core/css-key.ts` 及属性入口 | 收紧 rules 公开输入，使用 Key／Variable 元组，不接受普通声明对象和字符串属性键；直接对象路径不依赖名称预注册，不为此强删底层兼容处理 |
| `value-material`、`component-handle-material`、`mixins` | 将通用材料的状态和配方放回正确的定义，接管现有需求 |
| `src/components/kits/Button/Button.style.ts` | 使用和延伸材料，保留组件自身选择器与差异，去除通用细节协调 |
| 对应测试、架构和样式说明 | 验证新行为；实现后同步真实 API 与职责 |

这些位置是责任导航，不要求每项都新建文件。拆分必须使创建、定义、选择、解析这条链更容易理解。

## 怎样验收

- **Value：** 不再接受或传播状态；已有状态需求全部由 Variable 接管。
- **创建：** states 可省略，可直接指定内容，也可传回调；回调拿到首实参本身，类型保持正确。
- **命名：** Variable 名字最后一个单词表达其存在形式，例如 Color、Size、Width；用途放在前面，不能只写用途而看不出是什么材料。
- **延伸：** 返回新 Variable，保存来源引用而不复制定义；自身状态优先，未定义时沿链查找，多层延伸遵循同一规则；来源不被修改，注册和声明使用正确对象及名字。
- **黑盒取值：** active 内容直接使用来源 Variable 即得到其 active 下成立的值；消费代码不读取内部状态。
- **混色内容：** 直接提供 colorMix 结果时，识别为内容对象；提供 source 回调时，传入正确来源并识别其返回内容。两种形式都能正确输出 CSS，不混用回调参数。
- **Cluster：** 对象配置声明成员；普通值消费表现为 default，调用返回对应 Variable。双 Cluster 声明按目标同名成员整组展开，来源额外键允许、缺键和目标同名冲突报错；只展开一层，保留状态与局部作用域，不修改共享成员。普通 Variable 目标接收 Cluster 内容仍取 default，消费端无需读取内部配置。
- **CSS 作用域：** 局部声明和嵌套继承按预期生效，不通过修改共享 JS 对象实现。
- **材料与 Button：** 通用材料能在不依赖 Button 身份的主体上使用；Button 无需重新实现通用状态和焦点配方。
- **整体维护性：** 没有平行的状态体系、额外配方选择步骤或无关清理；必要的定义重复不强行抽象。
- **阅读顺序：** 所有定义放在首次使用之前，后续复用，不设置集中定义例外。
- **抽象归属：** 根据定义描述的对象和领域判断；被组件使用不等于属于组件，删除业务名字也不能使组件专属定义成为通用抽象。
- **rules 输入：** 类型检查接受 Key／Variable 元组及 Mixin 组合，拒绝普通声明对象和裸字符串属性键；Mixin 配置、内容字符串和条件字符串仍正常使用。直接 Key 对象无需名称预注册；不以删除底层解析实现作为验收要求。

实施结束运行类型检查、完整单元测试、完整浏览器测试和生产构建。项目脚本为 `type-check`、`test:unit`、`test:browser`、`build`，执行前核对实际配置。测试必须通过；同时满足上面的职责和使用方式，才能判定第一层完成。

## 还需要确定的问题

这些是实现前需要解决的具体问题，不是可以自行加入的新要求。

| 问题 | 已明确的边界 |
| --- | --- |
| 某个已有视觉差异无法用这些接口直接表达时怎么办？ | 先指出具体差异及缺少的能力，不自行发明公共分类，也不悄悄改变效果 |

技术事实能从代码和实验确认的，实施时自行查明。发现方案无法完整成立，或存在需要用户抉择的设计分叉时，必须向用户提问：用具体例子说明哪里接不上、有哪些选择、各自改变什么。得到答案前不实施依赖该选择的部分，不用自行补出的概念填空。
