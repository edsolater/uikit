# Token 设计

本文记录 Style System 的统一内容模型与创建接口，包含截至 2026-10-27 的裁决。基础迁移及参数归一、CSS 准备边界的[增量修复](../../../docs/plans/261026_Token参数归一与CSS准备边界.md)均已通过单元、真实浏览器、类型检查及构建验证，不表示已发布新版本。2026-10-27 新增的“架构自动声明、Token 不推荐外部重复声明”按[自身定义与 Button 状态归位](../../../docs/plans/261027_Token自身定义与Button状态归位.md)落实；这是一项君子协定，手动声明保留为 dangerous 操作，不做运行时或类型拦截。本文取代旧内容对象、内置用途变体和独立定义加工操作的设计；历史计划只作为当时决定的记录，不再指导这些对象的实现。

本文是当前设计依据。设计讨论期间先在本文收敛决定，其他接口、教程、行为及架构文档等本文设计完成后再同步；这些文档的旧名称或旧说明不反过来约束本文，也不要求每次讨论都同时修改。

Token 是原有内容模型的替代者及语义继任者，不是从零重新规定样式行为。已经确定、且没有被新裁决替换的根据地、默认声明、状态、引用及 CSS 层叠语义继续有效；本文漏写时应补齐，不能把遗漏当成需要用户重新决定的问题。

## Token 的基本结构

Token 统一原有 Variable 和 Value 的概念，用来表达一个可用于样式的值，以及它在不同状态下怎样取值。

一个 Token 的核心内容是：

- `value`：基础值，可以承载直接值、引用和计算表达式。
- 可选的 `state`：状态取值。每项可以是固定值，也可以是根据基础值产生新值的规则。

`name` 为 Token 提供名称。name、state、address、registration 以及是否被 modify 共同决定 Token 如何输出到 CSS，不是第三种取值内容。

Token 的身份不取决于值从哪里产生。直接定义、引用其他 Token、计算或通过函数返回的结果，都使用 Token 表达，不再区分独立的 Variable 和 Value 对象。

这是对原有模型的替换。迁移完成后，非 CSS 坍缩部分的创建、引用、计算、状态、复用及内部处理链统一使用 Token，不再保留独立的 Variable、Value 抽象，也不通过 Token 包装旧对象后转交旧机制。CSS variable 与 CSS value 的区别只在 CSS 坍缩部分出现。表示基础内容的普通参数仍可叫 `value`，不因此形成独立的 Value 对象。

## 创建写法

基础内容固定放在第一个参数，名称、状态和地址等配置放在第二个参数：

```ts
// 基础值及名称。
token(value, name)

// 仅提供基础值。
token(value)

// 状态与名称写在配置中。
token(value, {
  state: {
    hover: (base) => multiply(base, 2),
    active: 4,
  },
  name: 'name',
})
```

第一个参数保存为 Token 的 default；如果它是已有 Token，则继承来源配置。普通对象和数组直接作为基础数据，不从其字段中提取 default、hover 或其他配置。

### 参数入口负责输入语法

创建入口处理来源继承，argument parser 归一基础内容和第二参数配置，CSS 输出不再判断原始写法：

| 首参数             | 解析方式                                                           |
| ------------------ | ------------------------------------------------------------------ |
| 可直接消费的原语   | 作为基础内容，例如 token('2px')                                    |
| 已有 Token         | 创建独立 Token，继承来源配置并合并追加 state；default 默认引用来源 |
| 其他可坍缩表达式   | 作为基础内容消费，不拆解表达式内部引用的 Token 定义                |
| 内容生产函数       | 作为延迟内容保存，创建时不执行                                     |
| 普通对象或数组数据 | 原样保存为基础数据，由普通格式或第二参数中的特殊输出方法解释       |

不再从第一个参数解析状态简写；即使数据含有 default、hover 等字段，它们也只是数据。没有提供 state 时不生成隐式空状态。

```ts
const spacing = token('2px')
const sequence = token(['2px', '4px'])
const metadata = token(
  { duration: 200 },
  {
    toCSSString: (data) => `${data.duration}ms`,
  },
)
```

对象和数组无需额外包装；特殊格式通过第二参数提供 toCSSString 和 dependencies，不把基础数据当成定义配置。

状态规则中的 `base` 是这个 Token 的基础值。例如基础值为 `2`，则 `hover: base => multiply(base, 2)` 表达悬停时使用基础值的两倍，`active: 4` 表达按下时直接使用固定值 `4`。这些规则描述条件下的取值，不要求 JavaScript 在每次交互时重新计算。

## Argument parser 的统一结果

创建参数有多种表现形式，argument parser 将它们归一为具有以下固定 key 的对象。后续创建、加工与坍缩只处理统一结果，不再识别调用时使用的简写。

```ts
{
  default,
  name,
  state,
  address,
  registration,
  onFirstScan,
  compileWaveIndex,
}
```

## Token 属性与方法的职责

前七项是 argument parser 的固定输出字段；后三项是内部信息或编译协议，不增加 parser 的 key。

| 属性或方法         | 所属与配置方式                                                       | 职能                                                                                                                        | 生效时机与边界                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`          | Parser 字段；由第一个创建参数提供                                    | 保存基础内容，可以是直接值、对象、数组、Token 引用或计算表达式                                                              | 作为自身定义的基础，不等待外部声明补齐或替换；state 以该基础及既定表达式加工结果展开。数据字段不作配置解析，提供内容不代表立即坍缩                                |
| `name`             | Parser 字段；可显式提供，也可由系统生成                              | 提供 CSS 自定义属性的名称，使声明、引用和 modify 指向一致的 CSS 标识                                                        | 显式命名使 Token 需要 CSS variable 身份；未命名但因其他条件需要该身份时，在坍缩过程中自动命名。不通过名称查找另一对象的定义                                       |
| `state`            | Parser 字段；可内联，也可传入独立 State，解析后统一为 Map            | 保存 StateCondition 到取值的映射；固定值指定该状态的结果，函数基于自身基础内容产生结果；同一 Token 的局部取值差异在这里表达 | 状态规则在定义地址表达，由 CSS 条件决定生效；条件可表达交互、主题、区域或组件分类。具有 state 就需要 CSS variable 身份，不是 JS 交互监听器                        |
| `address`          | Parser 字段；可选固定定义地址                                        | 指定 default 与 state 的固定发布位置；继承与覆盖后仍未指定时，需要 CSS variable 的定义建立在当前 AST 消费地址               | 显式提供就需要 CSS variable 身份；真正全局材料显式指定 root。同一无地址 Token 可在多处分别建立定义，不锁定首次使用地，也不写回 address；普通 CSS value 仍直接输出 |
| `registration`     | Parser 字段；可选 CSS 注册配置                                       | 描述 @property 的 syntax、inherits 及可选 initialValue，约束 CSS 自定义属性的类型、继承和初始值                             | 提供就需要 CSS variable 身份，并在 CSS 输出中建立所需注册；initialValue 独立于 default，不自动从 default 推断                                                     |
| `onFirstScan`      | Parser 字段；可选生命周期回调                                        | 同一对象在一次编译中首次被 AST 扫描到时提供附加规则，可以返回包含 modify 的规则                                             | 每对象每次编译只调用一次，后续位置或波次扫描复用其规则；不受 compileWaveIndex 门槛限制，也不代表已坍缩                                                            |
| `compileWaveIndex` | Parser 字段；可选非负整数，缺省为 0                                  | 指定 onCompile 最早允许执行的编译波次                                                                                       | 是允许开始的门槛，不是必须完成的波次，不要求每波重复执行；不推迟首次扫描，也不绕过坍缩前读完相关修改的要求                                                        |
| `_kind`            | 内部字段；可对外读取，不由 parser 接收，调用方按约定不修改           | 表达系统根据定义及 AST 操作确定的 CSS 坍缩类别                                                                              | name、state、address、registration 或 modify 使其需要 CSS variable，否则输出 CSS value；修改读取完成后才能据此坍缩，不用于判断是否复制来源定义                    |
| `onCompile`        | 编译协议的生命周期方法；Token 实现可提供，特殊创建者也可在定义时提供 | 在编译阶段获得操作 AST 的机会，可以通过内部调用设置内容、插入或改写节点                                                     | 按接受编译的对象身份，每对象每次编译调用一次，不因多个引用位置重复调用；受 compileWaveIndex 门槛约束，返回 void，不将返回值当作解析结果或操作描述                 |
| `toCSSString`      | 内容输出方法；不属于上述 parser 配置                                 | 描述自身内容怎样输出为 CSS 文本，需要输入时消费已准备好的子内容结果                                                         | 在输出所需条件满足后表达坍缩结果；不负责调度扫描、决定波次或收集所有修改，不能在构造引用时提前冻结输出形式                                                        |

固定 key 不意味着调用者必须提供全部配置。可选项的缺省表示由 parser 统一处理；自动名称仍按坍缩规则产生，不因统一结构中存在 name 这个 key 就提前生成。

统一结果不包含 `priority`，Token 不再储存单独的声明优先级。`address` 表达定义位置；普通属性 entry 的同址顺序由声明系统处理，不因此把 Token 重复赋值纳入正常编写方式。

## 声明由架构完成，Token 不推荐外部重复声明

**调用方定义 Token 和属性 entry，架构负责生成声明；调用方不再手动调用 declare。**
rules 的第二参数接收对象、二元 entry、Mixin 结果及其嵌套集合，由入口统一展开和登记。
普通 CSS 属性或 Key 是属性 entry 的目标，Token 可以作为其内容：

```ts
const gap = token('2px')
const foreground = token('black', { address: '.Panel' })

rules('.Panel', { 'padding-left': gap })
rules('.Panel', [$color, foreground])
```

上例的属性声明由 rules 自动处理。foreground 需要的 CSS variable 定义由编译器在其 address 建立，消费处取得引用；不额外书写 declare(foreground, 'black')。
这两类声明分别属于属性消费和 Token 定义，不需要调用方在两处重复提供同一基础值。

**正常用法在 Token 创建时用 default、state 及既定表达式加工确定取值，不再把它作为外部赋值控制点。**
以下写法仍允许执行，但属于 dangerous 操作；不能把显式函数改成隐式 entry 就称为正常定义：

```ts
// dangerous：为已有 Token 追加另一份基础或局部取值定义。
declare(foreground, 'blue')
rules('.Panel.Special', [foreground, 'blue'])
rules('.Panel.Special', [foreground, undefined])
```

同一主体在某个条件下取不同值，放入该 Token 的 state；条件不局限于 hover、active，也可以表达区域、主题和组件分类：

```ts
const whenSpecial = stateCondition('&.Special')
const foreground = token('black', {
  address: '.Panel',
  state: [
    [whenSpecial, 'blue'],
    ['hover', (base) => oklch(base, { alpha: 0.8 })],
  ],
})
rules('.Panel', [$color, foreground])
```

独立用途或另一份配置创建新 Token，通过明确的消费位置接入。创建 reviewForeground 不会自动替换已经消费 foreground 的组件；既有引用仍指向原 Token。
复用材料和计算规则不要求复用同一个可被各处重新赋值的身份，不能为省一个对象而增加隐含替换关系。

这个约束减少的是控制和理解成本：外部重复声明会让读者同时追踪原定义、地址、状态、各处赋值及层叠顺序，也会要求系统决定 state 到底以哪份声明为基础。
把条件变化收回 state、把独立配置表达成新 Token 后，定义与变化的关系可以在所属主体处读完。
选择依据不是避免创建 Token 的性能开销，而是避免没有独立职责的控制点和多处定义入口。

退出正常编写方式的是手动声明和 Token 的外部重复赋值，不是 CSS 声明能力。
declare 及等价 Token entry 保留原能力，不加 assert、类型禁用或运行时警告；这是调用方遵守的君子协定。
编译器仍生成 Token 的默认与状态声明，rules 仍登记普通属性声明；onFirstScan、onCompile 及 modify 的既定编译职责保留。

## 根据地与自身定义

显式 address 固定 default 和 state 的发布位置，真正的全局材料应明确写 address: ':root'。创建结果未指定 address 时，只有需要 CSS variable 的 Token 才在当前 AST 消费地址建立定义；同一 Token 在 A、B 使用，就分别在 A、B 发布，不锁定首次使用地，也不写回 address。token('2px') 没有其他命名或修改需求时仍直接输出 CSS value，不因此产生变量。

default 是 Token 自身定义的基础，编译器按实际消费及坍缩需要在根据地生成声明，不等待调用方提供另一份声明。address 不等于创建时立即输出 CSS；未被消费的定义不因指定 address 就自行挂载。

正常用法中，状态回调以所属 Token 的基础内容为 base，既定 modify 对表达式的加工仍按其契约处理。state 不是按对象书写顺序依次加工的流水线，某状态的固定值不会自动成为另一状态回调的基础。显式固定在祖先地址的公式仍遵循 CSS 继承，不因后代消费而搬到当地重算；未指定地址的定义则随每个消费位置发布。

危险重声明仍保留底层层叠和根据地选择行为。调用方自行承担它改变基础、遮蔽状态或影响其他引用的后果，不能把这些额外关系当成正常定义的必要步骤。

`definitionKey` 不进入新模型。CSS 声明目标由坍缩层根据名称生成，不在 Token 上额外保存一个目标键对象。

`declarations` 也不进入新模型。值依赖通过 Token 引用表达，附加规则通过 onFirstScan 表达，不额外维护共同声明列表。这里不依靠 TypeScript 编辑器的“查找引用”：编译器处理的是实际进入样式 AST 的对象及其引用。移除这个字段不等于取消 CSS 坍缩层的声明操作。

## State 可以独立复用

State 放在第二参数的 state 中，可以直接定义，也可以独立复用。输入支持快捷名对象、Map、单个条件 entry，以及这些形式的任意嵌套数组或 Iterable。入口按顺序展开容器，entry 保持条件和值的配对。条件只接受静态预置快捷名或 StateCondition：字符串键与 entry 中的字符串都查同一张预置表，条件对象不隐式转成字符串。

```ts
const whenCompact = stateCondition('&[data-density="compact"]')
const emphasisState: TokenStateInput = [
  [whenHover, (base) => multiply(base, 2)],
  [whenCompact, 4],
]

const emphasis = token(2, {
  name: 'emphasis',
  state: emphasisState,
})
```

独立 State 保存可复用的状态规则，接收它的 Token 提供基础值。辅助函数可以返回对象或条件 entry，调用方直接放进嵌套组合，不必先展开或转换为 Map：

```ts
const buttonColorSource = buttonToken(brandColor, {
  state: [interactiveColorStates({ chromaResponse: 1 }), { danger: badColor }],
})
```

argument parser 一次归一为 `Map<StateCondition, TokenStateRule>`，后续流程不再识别容器写法。已定义的 Token.state 也可以直接参与组合，不使用对象展开或 Object.entries 读取 Map。

StateCondition 直接使用单个 Condition 的 { header } 对象。参数入口将静态预置快捷名换成 stateConditionRegistry 中的原对象；同 header 的规则归一为一项，后值覆盖前值并保留首次插入位置，最终 Map 保留条件对象。编译直接消费该 Map，不增加解析结果包装、额外身份元数据或状态排序。

组件级 state 优先使用稳定的静态预置快捷名，Style System 内部优先引用集中定义的 StateCondition 变量，便于复用和维护条件；这是写法约定，不限制另一种合法输入，见[主体状态条件](主体状态条件.md#token-提供状态反馈)。

`stateCondition(input)` 从根入口创建一个局部主体条件，不登记名称。组件可直接将临时的 `whenComponentState = stateCondition(...)` 对象放入 state，无须也不应为它登记全局简写；hover、active 等常用稳定条件使用现成快捷名。快捷名映射只由 Style System 所属 Pieces 条件模块维护，由 stateConditionRegistry 汇总。共享和局部条件都可直接用于 state，不提供条件组合 API。映射保留原对象与 CSS，不包裹 :where()，也不决定排序；同一属性按原生特异度和定义顺序层叠。这是职责与编写约定，不增加冻结或运行时权限机制。

未定义字符串在创建 Token 时立即报错，不回退为 CSS 条件。`'&[data-ready]'`、`'@media (...)'` 等原始 CSS 必须先交给 stateCondition，再以对象 entry 输入 state；没有原始字符串例外。普通 rules 的字符串仍表示 CSS 地址，不查状态快捷名表。

`hover`、`active` 字符串与对应对象只判断交互状态；`whenEnabled`、`whenDisabled` 等条件独立匹配，不默认互相排除。不同属性的状态效果共同生效，同一属性按 CSS 层叠决定结果。Map 状态可以直接参与嵌套组合；手动读取它仍使用 Map 迭代，不使用 Object.entries 或对象展开。

## 产生 Token 的函数

不建立 RuleToken 类型。需要接收输入再生成 Token 时，使用返回 Token 的普通函数。

Token 也不再内置 `variants` 或 Variant 选择接口。普通函数可以根据输入计算或组合新 Token，但不根据组件类型替使用者选择材料。

Token 描述自身的样式聚合，不认识使用它的组件。公共阴影可以按几何尺度提供不同材料，颜色可以表达 surface、content、boundary 等视觉作用；Button、Dialog 等组件自己选择材料，并在各自样式文件中定义状态差异。公共材料不持有组件用途分支，也不内置某个组件的布局比例。

```ts
// 示意一个根据输入产生 Token 的普通函数，不新增工厂类型。
const doubled = (base) => token(multiply(base, 2))

const amount = doubled(4)
```

函数与它返回的 Token 是两个对象：函数接受输入，Token 表达产生的样式值。原来讨论的“缺少输入的 RuleToken”不再作为 Token 的一种特殊形态保留。

加工已有 Token 同样使用普通函数：读取其 default、state 及其他规范化信息，组合需要继承或覆盖的部分，再创建一个新 Token。函数可以分别加工基础值和状态，也可以提供新的状态；具体组合由函数表达。

直接传入已有 Token 时，token(source, options) 创建独立 Token 并继承其定义配置。default 默认引用 source，保留对来源当前 CSS 值的联动；完整名保留来源完整名作为引用部分，并为新 Token 确定自身实体标识；options.name 只指定实体，省略时自动生成，因此不会复用来源的完整身份。address、state、registration 和生命周期配置继承来源，追加配置覆盖相应顶层字段，显式 undefined 清除对应配置；default 可以覆盖为不同类型。state 按条件合并，同 header 的规则覆盖且保留原位置，新条件追加；state: {} 不删除已有状态条目，state: undefined 清除整份状态。整个过程不修改来源，也不复制运行身份、已分配的自动名称或隐藏的输出方法。

```ts
const panelSpace = token(baseSpace, {
  name: 'panel-space',
  address: '.Panel',
})
```

一组定义共享名称前缀与固定位置时，用 createNewTokenGenerator 预设共性：

```ts
const panelToken = createNewTokenGenerator({
  prefixName: 'panel',
  address: panelConditionPath,
})
const panelSurface = panelToken(surfaceColor, { state: { hover: paperColor } })
const panelSpace = panelToken(baseSpace)
```

完整 name 由可选前缀、可选来源引用和自身实体标识组成，以连字符连接。普通 `token(value, { name: 'brand-color' })` 没有前缀或引用，完整名就是 `brand-color`；`token(source, { name: 'local' })` 把来源完整名作为引用，得到 `brand-color-local`；省略实体时生成 `brand-color-<自动标识>`。前缀只参与组合，不改变实体标识。普通匿名直接值仍按需要输出 CSS value，自动实体只在需要内部名称时分配。

生成器统一管理定义地址，只为同一创建模型提供前缀；调用处不能传名称字符串或指定 `name`、`address`。例如 `buttonToken(brandColor)` 得到 `button-brand-color-<自动标识>`；直接 `buttonToken('red')` 没有来源引用，得到 `button-<自动标识>`。无显式名称的 Token 来源也有稳定的内部完整名，派生时仍保留这一引用；取得引用名不会使来源从 CSS value 升级为 CSS variable。地址由生成器配置决定；未配置时随消费位置发布，不继承来源地址。其余配置继续沿用 Token 契约。

内部名称不含 CSS 的双连字符，CSS variable 输出只添加 `--`，即 `--${name}`。自动实体由现有标识生成器产生，不按名称分类、不登记显式名称或管理占用状态，也不约定自动标识的具体格式。

JS 变量名表达业务含义，供人阅读。CSS 自定义属性名只是映射标识，由系统自动生成，具体拼写没有业务意义；测试定位和调试追溯时，通过 Token 对象取得名称并找到对应 CSS，无须手工维护两套语义名称。

不再提供独立的 `adjust` 操作。它原来承担的定义组合与加工，直接由这些普通函数完成。函数返回的新 Token 按自己的定义和使用情况确定坍缩方式；“经过某个加工函数”本身不是生成 CSS variable 的条件，也不需要记录“使用过 adjust”。

新 Token 保存组合完成后的定义，不记录加工历史。不保留 `resultSource`、`resultSourceTransform`、`resultSourceStates` 或 `resultSourceVariants`，也不根据这些字段重放加工。新 default 如果需要读取原 Token 的当前值，直接在计算表达式中引用原 Token；这种值依赖不需要另一份来源记录。

## 继承定义与延迟生产

已有 Token 直接传给 token，继承其定义并合并追加配置。来源已经可用时，无须再包装成返回它的函数。

```ts
const source = token(2, { state: { hover: (base) => multiply(base, 2) } })
const target = token(source, { state: { active: 4 } })
```

target 继承 source 的 hover，并追加 active；来源不变。默认内容引用来源当前值，计算表达式内部的 Token 仍按内容消费，不在消费端复制配置。

生产函数保留用于延迟计算、消费时读取变化数据或等待内容可用等明确目的，例如：

```ts
let currentWidth = '2px'
const measuredWidth = token(() => currentWidth)
currentWidth = '4px'
```

measuredWidth 在编译消费时读取 currentWidth，而不是在创建时固定为 2px。函数提供内容，不是选择是否继承的配置开关；返回 Token 时也按普通内容消费，不另建一种引用模式。

两份具有独立职责的 Token 定义分别命名，再显式引用，例如 buttonOpacitySource → buttonOpacity；同一链条保留 Opacity 抓手，Source 放在最后，完整规则见[样式系统命名](样式系统命名.md)。不直接用 token(token(...)) 隐藏其中一份定义。multiply、oklch 等工具返回的 Token 仍可直接作为表达式组合，不要求为每个计算步骤增加中间变量。

## Modify 与内部类型

`modify` 保留为使用端操作，表达在指定位置或条件下修改目标 Token。它不等同于返回新定义的普通函数。

modify 承担既定的表达式加工，不是向 Token 追加第二份 default 或局部赋值声明。手动声明退出正常用法，不扩大或取消这项加工能力；组件默认值和状态仍应在自身定义中表达。

Token 内部具有 `_kind`，由系统根据定义及 AST 上的使用情况确定，可以对外读取，调用方按下划线命名约定不修改。无需 readonly 或运行时写保护；系统仍可根据编译情况更新它。它是内部处理信息，不是 argument parser 返回的第八个 key，也不恢复独立的 Variable 或 Value 模型。嵌套内容始终按表达式消费，_kind 不用来决定是否复制来源定义。

当 AST 登记了对某个 Token 的 modify，这个 Token 在本次编译中的内部类型就需要支持 CSS variable。即使它最初只有一个直接值、没有 name 和 state，也会因 modify 获得 CSS variable 身份；缺少 name 时自动生成名称。同一 Token 的声明、引用和修改使用一致的名称。

创建 AST 和登记 modify 时不立即把 Token 输出成 CSS 文本，因此不会因为先遇到一次普通值引用，就提前固定其坍缩结果。

用户提供的定义与编译派生信息需要区分：自动名称不是用户显式配置 name，因 modify 产生的内部身份也不是用户修改了定义。后续编译按当次实际定义和操作判断输出需求，不能仅因上次生成过名称就永久把一个直接值升级为 CSS variable。自动名称是否缓存、内部记录存放在哪里属于实现细节，不新增公开配置或要求调用者清理内部字段。

## 扫描、编译回调与 CSS 输出

原 onActive 的目标名称改为 `onFirstScan`。它表示同一对象在一次编译中首次被 AST 扫描到的时机，而不是整个编译的第一波。同一对象后续被其他位置或后续波扫描时，不重复调用，复用其提供的规则；新的一次编译重新取得首次扫描机会。

各入口的职责和配置归属统一见上方属性表：onFirstScan 是首次扫描机会，onCompile 是编译阶段的 AST 操作机会，toCSSString 是内容输出方法。

onCompile 操作 AST 是允许的，包括设置内容或插入节点。这些操作通过回调内部调用完成，不把回调返回值当作解析结果或操作描述。toCSSString 表达输出，onCompile 提供阶段操作机会，两者可以同时存在，不因允许 AST 操作就判定职责混乱。

onCompile 可以由 Token 实现预先定义，也允许特殊创建者在定义时提供；不能因为它不在上述七个基础参数字段中，就禁止创建者提供编译协议方法。基础配置归一与对象提供的编译方法是不同职责，本文不另造专门的对象类型或构造层。

回调属于接受编译的对象。多个位置引用同一 Token，不使该 Token 的 onCompile 重复执行；无地址 Token 的多处定义由 AST 的每位置准备负责，不借生命周期回调重复接线。如果实际建立了独立的引用对象，其生命周期按自己的对象身份处理。等待 compileWaveIndex 或后续遍历不等于再次调用已经执行的回调。

compileWaveIndex 是最早处理门槛，不表示指定波次必定完成，也不要求此后每波重复调用。最终坍缩仍须等待相关修改读取完成。

## 修改读取完成后再坍缩

“坍缩”表示把 Token 转成 CSS 能够消费的表达。Token 不必都输出为 CSS variable。

坍缩不是 token() 调用时或第一次构造引用时即时发生的。逻辑顺序是：

1. 参数解析得到统一定义，构造样式 AST 并登记 Token 的引用和 modify。
2. 沿激活链展开实际引用和 onFirstScan 返回的规则，并在允许的波次执行相应对象的 onCompile；读取首次扫描规则及编译回调内部 AST 操作引入的相关修改。onCompile 本身返回 void。
3. 在相关修改的读取完成之后，根据定义及 AST 上的操作确定内部 _kind，再选择 CSS value 或 CSS variable 的坍缩路径；需要 CSS variable 且未命名时，自动生成名称。
4. 生成所需声明与引用，使用输出方法产生 CSS 文本；内容处理与前面的编译回调均遵守各自波次要求。

不限定激活波次数，也不要求所有 modify 在第一波激活前出现。必须满足的时序是：Token 坍缩之前，能影响它的修改都已经读完，不能输出后才发现晚到的 modify。这里规定完成条件，不预先指定实现算法。compileWaveIndex 仍约束相应内容的处理时机。引用遍历是编译中沿实际对象关系展开定义，不建立另一套持续监听变化的运行时依赖系统。

“相关修改读取完成”包含 onFirstScan 产生的规则，以及 onCompile 内部操作 AST 引入的修改；不能只检查首次扫描提供的规则，就认定已可坍缩。这是同一完成条件，不另加固定波数或要求用户限制回调能做什么。

输出规则如下：

| Token 的定义与使用情况                                   | CSS 输出方式                                              |
| -------------------------------------------------------- | --------------------------------------------------------- |
| 有 name，没有 state                                      | 声明 CSS variable，消费处使用对应引用                     |
| 有 name，也有 state                                      | 输出默认值与状态声明，消费处使用对应 CSS variable 引用    |
| 有 state，没有 name                                      | 自动生成 name，再输出默认值与状态声明及引用               |
| 提供 address 或 registration，没有 name                  | 自动生成 name，输出 CSS variable 及相应位置声明或注册     |
| 被 modify，没有 name                                     | 自动生成 name，输出 CSS variable 声明、修改所需声明及引用 |
| 没有 name、state、address、registration，也没有被 modify | 直接输出 CSS value，例如 2px                              |

自动命名由系统承担，使用者不必为了书写状态、指定地址或注册、使用 modify 先手动起名。“没有 name 时自动附上 name”用于需要 CSS variable 身份的 Token，不要求普通直接值也生成 CSS variable。缺省 address 不能在 parser 中无条件补成一个已指定地址，否则所有普通值都会被误判为 CSS variable。仓库已有 [名称分配器](../custom-property-names.ts)；实现时先核对并复用其名称分配能力。

无状态、未命名且未指定地址或注册的 Token 因使用方式而改变输出路径，例如：只有 token('2px') 的消费时直接输出 2px；同一 Token 另被 modify 时，在坍缩前确定其 CSS variable 身份，所有消费使用对应引用。不能因引用与 modify 在源规则中的先后位置不同而产生不一致的身份。

## 实现时的验收依据

- 基础内容固定为第一个参数，状态与其他配置放在第二个参数，不解析第一个参数中的 default、hover 等数据字段。
- 对象和数组直接承载原始数据，格式器、依赖及当前 default 替换能力继续有效；数据形式不改变公式的定义位置。
- Argument parser 返回固定的七个 key；后续流程不再根据原始参数写法分支。
- 状态回调基于所属 Token 的基础值求值，固定状态值直接替换该状态下的取值。
- rules 对普通 CSS 属性或 Key 的对象、entry 和嵌套集合自动完成声明，调用方不再手动调用 declare；Token 作为属性内容正常消费。
- Token 的 CSS variable 定义由编译器在显式 address 或当前消费地址建立；无须先补一条赋值或空值声明。
- declare(token, value)、[token, value] 及 [token, undefined] 保留为 dangerous 操作，不作运行时或类型拦截；组件正常实现不依赖这些外部赋值入口。
- 同一 Token 的条件取值差异写在 state；独立配置创建新 Token，并明确接入消费，不自动替换旧引用。
- State 可以独立复用，也可以在创建 Token 时直接书写。
- state 条件只接受静态预置字符串快捷名或 StateCondition；未定义字符串立即报错。原始 CSS 通过 stateCondition 对象的 entry/Map 输入，解析后统一为 Map；业务不读取 header 或裁剪选择器。
- 共享快捷名在所属 Pieces 条件文件的映射中维护，局部条件直接使用 stateCondition 对象。hover、active、enabled、disabled 等条件独立匹配，不要求业务枚举交集。
- 有状态但未命名的 Token 能自动取得名称；使用者不需要补写 name。
- Token 不持有内置 Variant；按用途产生 Token 的能力通过普通函数表达。
- 不再提供 adjust；定义加工直接使用返回 Token 的普通函数。
- 非 CSS 坍缩部分不再保留原有 Variable、Value 抽象，也不引入 RuleToken 类型或包装旧模型的转交层。
- Token 不保存 priority、definitionKey、declarations 或 resultSource 系列字段；加工由读取定义并返回新 Token 的普通函数完成。
- 已有 Token 直接传入并继承来源配置，state 软合并差异；生产函数须有明确的延迟生产目的，不用于规避继承。
- 内部 _kind 由系统维护并可对外读取，调用方按约定不修改；不增加 parser 的固定 key，不要求 readonly 或运行时写保护。
- 未提供 name、state、address、registration 且未被 modify 的 Token 直接输出 CSS value。
- modify 在坍缩前参与类型确定；对同一 Token 的引用写在 modify 前后，均使用一致的 CSS variable 身份。
- 因 state、address、registration 或 modify 需要 CSS variable 的匿名 Token 自动生成名称，声明、引用和修改共用该名称。
- onFirstScan 可以产生 modify；坍缩前相关修改读取完成，不限定激活波次，内容处理仍遵守 compileWaveIndex。
- onFirstScan 在一次编译中对同一对象只调用一次，与首次扫描所在的全局波次无关；后续扫描复用返回的规则。
- onCompile 是返回 void 的生命周期回调，允许通过内部调用操作 AST；toCSSString 负责 CSS 文本输出，不将两者混为返回解析结果的入口。
- onCompile 可由 Token 实现或特殊创建者提供，按被编译对象身份每次编译调用一次，同一对象的多个引用不重复触发。
- 需要 CSS variable 且未指定 address 时，在各 AST 消费地址分别建立自身 default 和 state，不写回 address；全局材料显式指定 root。危险重声明仍可使用底层 CSS 层叠能力，不反过来成为正常定义模板。
- onCompile 的 AST 操作引入的修改也须在坍缩前读完；重复编译不把先前自动生成的名称误当成用户显式命名。
