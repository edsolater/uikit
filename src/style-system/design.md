# Style System 设计

本文保存已经确认的对象模型与使用方式；真实实现及运行边界见 [architecture.md](architecture.md)。

## 目标与范围

样式要能够分片提供内容，让读者通过语义分区找到配置，再通过组装清单确认节点归属。去掉只为维持旧调用方式存在的包装，不把现有代码、旧测试或已用过的名称当作不可改变的要求。

本轮覆盖 Style System 与 Button 的正式使用链；其他组件不迁移。保留现有 CSS 属性名、变量覆盖入口、默认取值、选择条件及级联关系，不借 API 调整改写视觉策略。

## 五个角色

| 对象 | 职责 |
| --- | --- |
| Key | 保存可检索的属性名称，普通对象，不与 Value 预先绑定。 |
| Value | 提供可用于 CSS 的内容；固定值、变量引用和复合值具有同一使用契约。 |
| Declaration | 用 name 表明声明目的，包含内容和 DeclarationRole；可输出一条或多条属性声明。 |
| Block | 持有累计内容，提供 of，具体种类负责格式和合法节点位置。 |
| Root | 沿实际结构激活 Value，把完整顶层规则同步追加到样式表。 |

函数是创建或组合手段，不增加 CSS 角色。Value、CSS Variable 和 Block 本身都不可调用；属性操作、组合工具及构造函数可以调用。

## Key 与属性操作

key(name) 返回保存 name 的普通 Key 对象，使用 const generic 保留字面量类型，不添加 Brand。declaration(key, value) 产生 Declaration；常用属性用具名函数提供入口，Key 与函数分别存在。

```ts
const colorKey = key('color')
const color = (input: Value | string) => declaration(colorKey, toValue(input))
```

属性操作必须显式给值，不用无参数调用自动选择 initial、unset、主题值或其他默认值。属性关键字可以直接传字符串；Value 保留原引用。合法性由浏览器判断，不穷举全局或各属性的关键字名单。

复杂属性保存各组成值，而不是把整个 border、font 等提前变成字符串。易于区分用途的部分使用位置参数；角色易混淆或涉及特殊分隔关系时用对象字段。例如 padding 支持一至四个位置值及按方向覆盖的对象；border 按输入顺序以空格连接；font 的字号与行高用对象明确斜杠关系。

## Declaration 的内容、解析与控制

外界只面对 Declaration，不再区分单条声明和声明组。name 表明它的目的，例如 color、padding、margin；role 是包含在节点内部的 DeclarationRole，负责把 content 解析成完整声明。一条属性只是其中一种输出形式，名称不决定实际输出几条属性。

declaration(key, content) 沿用普通属性语法；第三个参数可提供内容解析函数，或提供负责完整输出的 Role。Role 访问子 Value 时必须调用 parseValue 并传递 context，不提前字符串化，也不另列依赖表。

普通配置不使用通用 set。当前运行链没有必须依赖整体替换的情形，因此不提供 set，也不预留 _set。需要调整配置时先在构造处明确内容，或使用属性自己的语义操作；不能通过直接改写 content 或另起一个替换方法绕过此限制。

将来确实需要内部替换时，统一用 _set 并标注内部方法。只有缺少它会使程序无法运行，且不存在合理的构造、组合或职责调整方案时才允许引入和调用；方便、少写几行、兼容旧调用和让测试通过都不构成必要性。必须在负责位置说明不可替代的原因。

transition 的 append 追加完整过渡条目，boxShadow 的 append 追加独立 Shadow。两者不拆解变量、关键字或已经组合的 Value；需要属性上的追加能力时，在构造处直接提供单项内容。

```ts
const buttonTransition = transition(
  [backgroundColorKey, fastDuration, standardEasing],
  [borderColorKey, fastDuration, standardEasing],
)
kitStyle.of(buttonTransition)
buttonTransition.append([opacityKey, fastDuration, standardEasing])

const buttonPadding = padding({ top: normalSpace })
kitStyle.of(buttonPadding)
// buttonPadding 仍是 Declaration；其 Role 输出 padding-top，而不是 padding 简写。
```

Block 的 of 直接使用 fnkit 的 flapDeep 展开全部分组数组，保留顺序与节点引用，不另建展开方法；Content 复用 MayDeepArray 类型。Declaration 是数组中的对象，其内部 content 不属于外部分组，过渡条目不会被拆散。flapDeep 底层使用原生展开，受引擎调用栈限制，不承诺极端嵌套深度。

移除 joinValues 与 transitionValue。属性决定如何消费单项或组合内容，通用格式器提供逗号等共同排版能力，不把分隔符和字符串片段包装成 Value。计算、颜色函数、阴影等独立内容拥有自己的语义解析器；属性消费这些内容，不重复实现它们的内部语法。

这些控制只作用于构建内容和后续解析。Root 不订阅 append，不更新已经提交的 CSS；激活后更新策略仍未确定。

## Value、材料与目录

Value 提供 parseCss(context)，只有 Value 具有可选 onActive。复合值在渲染时继续访问组成值，不预先丢掉引用，也不另外维护依赖清单。

calcMultiply(amount, factor) 明确表示 CSS calc 乘法，不是 JS 立即求值。例如 calcMultiply(value('120ms'), value(2)) 输出 calc(120ms * 2)，浏览器计算为 240ms。materials/motion 用时长乘以动效倍率，普通偏好为 1，减少动效偏好为 0；这不是新增 Theme 系统。

固定尺度与变量引用都可以成为属性输入。材料按颜色、空间、半径、字体、动效、阴影等含义组织，不再将 values 与 variables 作为两套公共使用入口。Theme、Color、Size 只是组织组名，不决定成员的注册、激活或赋值行为，不另建 Theme 系统。

Token 只表示可复用的值材料，不增加对象角色、构造函数或目录。Variable 属于 Value；CSS 属性操作不是 Value，单独归入 declarations。

基础 CSS 对象位于 core/，具体 Block 位于 blocks/。values 保存独立于消费属性的值对象与内容结构，不按“内部有多个部分”统一归为 composites：

- materials 提供已经定义好的值材料，回答“选用哪个值”。固定值、CSS variable 和预先组合的值可以同处一个系列，按颜色、空间、圆角、字体、动效等含义组织，不按构造方式拆文件。
- functions 保存 calc、color-mix、translateY 等 CSS 函数值，各自负责对应的运算或函数语法。
- shadow.ts 表达一条阴影，transition.ts 表达一项过渡，list.ts 表达完整值节点的列表。它们不是 CSS 属性声明，也不因结构复杂就变成 CSS 函数。

格式能力位于 formatters。formatCommaList 只按顺序解析完整条目并输出逗号列表，不认识阴影、动画或背景，不展开条目内部的数组，也不创建 Value。当前阴影和过渡共同使用它；不为尚未实现的背景或动画属性增加空壳。

材料系列使用 font.ts、motion.ts、color-surface.ts 等文件名，不以 theme 表示“使用了变量”，也不以 appearance 收纳不同类别。系列内不再建立子目录。values、materials、functions、formatters 都是分组目录，不建立 index。选择条件与组合工具分别位于 selectors/、mixins/。

### 值对象、组合与消费属性

Value 首先表达内容自身的含义，不围绕某个 Key 建立身份。单个属性恰好直接消费一个值，不意味着值类型就是属性类型；聚合后的内容也不会成为 Key，而是成为 Declaration 的内容。

Shadow 表达一条阴影的偏移、模糊、扩展与颜色；shadowValue(shape) 返回 Shadow。BoxShadowDeclaration 表达 box-shadow 属性对一条或多条阴影的消费，Key 只指出属性名称。Transition 表达一项过渡，TransitionDeclaration 表达 transition 属性及其条目列表；过渡中的 property 字段是过渡目标，不是它自身所属的消费 Key。

```ts
const contact = shadowValue({ x: '0', y: '1px', blur: '2px', color: 'black' })
const diffuse = shadowValue({ x: '0', y: '6px', blur: '18px', color: 'black' })

const appearance = boxShadow(contact, diffuse) // BoxShadowDeclaration，不是 Shadow。
const sharedShadow = variable('shared-shadow', { fallback: valueList(contact, diffuse) })
```

valueList 保存完整 Value 节点及其顺序，解决多项内容被变量引用的需要；阴影并不独占这个能力。它不接受任意分隔符或字符串片段，不恢复 joinValues。列表解析通过 parseValue 保留每个节点的激活链；属性直接配置列表时同样保留单项引用。

各条阴影内部的长度位置由 Shadow 自己解析，逗号由列表格式器提供，冒号与分号由 Declaration 提供。背景、动画等后续属性沿用这一职责判断，不把各自的内容语法塞入通用格式器。

名词式函数调用表示取得该对象，保留 shadowValue，不机械添加 create、build 等构造动词。MixColor 表达混色参与项。材料名称区分默认来源与作用域覆盖入口，例如 defaultForegroundColor 与 foregroundColor；不靠缩写或词序倒置区分二者。CSS 自定义属性名称仍是既有样式接口，不随内部重命名改变。

混色比例由各配方就近保存并说明占比主体，不集中放在透明度材料中。相同字面量不意味着相同业务配置，不为了消除数字重复而制造共享节点。

基础数值有明确单位或比例；同一个空间尺度可以用于 padding、margin、gap 或边缘厚度，不按使用属性复制数值。半径与普通空间即使数值相等也可保留各自语义。

使用方直接导入有独立含义的名字，例如 bgColor、normalSpace、pillRadius；不依赖 properties、cssProp、mix、values、variables 等 namespace 才能理解。移除 namespace 后，把必要语义放进具体名称，不用 normal、small 等脱离语境的名字冒充完整入口。

## CSS Variable 的声明、定义与使用

CSS Variable 是 Value 的一种，保存名称、可选 fallback 和可选注册行为，是不可调用的普通对象。

```ts
const bgColor = variable('bg', { fallback: defaultBackground })
const localDefinition = declareVariable(bgColor, red)
const appearance = backgroundColor(bgColor)
```

- variable 声明引用身份，不为任何组件设置当前取值。
- declareVariable(variable, input) 产生 Declaration；参数必须是 CSS Variable，不是任意固定 Value。
- 把 Variable 作为属性输入时，输出 var(...)。
- Declaration 接入哪个规则，定义就属于哪个作用域；不改变共享 Variable 或它的 fallback。

declareVariable 使用谓宾顺序表达动作。定义渲染时，目标 Variable 和输入 Value 都沿同一上下文参与激活，不能因为只定义而未使用就漏掉 @property 注册。

variable 是唯一的变量创建入口，原 token 构造入口退出。fallback 是引用兜底，root 是显式可选的根作用域默认定义，registration 是 @property 注册，不能相互替代。

```ts
const spacing = variable('spacing', { fallback: distance })
const themeColor = variable('theme-color', {
  root: { value: lightColor, dark: darkColor },
})
```

未提供 root 时不产生根规则；提供时保留低优先级 :where(:root)、data-theme 暗色覆盖与可选 reducedMotion 覆盖。root.value 是根默认值，不是 var 的 fallback 或 @property 的 initialValue。这些条件是既有样式约定，不另建 Theme 系统。

registration 与 root 可以同时提供。Value 的 onActive 返回值可以是单个 Rule 或递归 Rule 集合，Root 沿用集合展开；Variable 返回自身需要提交的规则列表。这样无需包装 Block，也不会漏掉其中一项。

作用域取值仍由 declareVariable 产生 Declaration。提供 registration 时由 Variable 的 onActive 返回 PropertyRule；初值中的 Value 继续参与激活。不因材料属于 Theme 组就强制注册。

## Block 与 Selector

Selector 保存选择条件，直接复用字符串即可。stateHover、stateActive 的定义注释说明具体匹配范围；名称变化不暗中改变是否排除禁用等条件。

每次创建 Block 就创建独立累计状态。Block 是普通对象，不是函数、函数工厂或外加控制器的包装。

```ts
const kitStyle = styleRule('.Button')

/** 按钮的悬停反馈。 */
const hoverStyle = styleRule(stateHover)
kitStyle.of(hoverStyle)

const buttonHoverAppearance = [backgroundColor(bgHoverColor)]
hoverStyle.of(buttonHoverAppearance)
```

of 表达 Block 与内容的组成关系，接收多个节点及递归分组，按顺序追加并返回自身，不替换已有内容或派生新对象。body 保存当前累计内容；parseCss 输出当前结构。不施加只读类型约束，由调用方遵守节点的修改约定。接收时展开集合、保留节点身份；来源数组后续变化不回写列表，子 Block 后续追加则可被父 Block 的下一次输出读取。

数组和普通对象只负责组织，不产生 CSS 层次。具体种类决定合法节点及标点：

- StyleRule 接收 Declaration、嵌套 StyleRule、Media。
- Media 接收顶层 Rule。
- Keyframes 接收 Frame；名称也是 Value。
- Frame 和 PropertyRule 接收 Declaration。

Rule 是可提交到样式表顶层的具体 Block 集合，不包括 Frame。Block 不承担 isActive、onActive、依赖表或 Root 订阅状态。通用 of 不猜测花括号、分号或插入位置。

## Button 的阅读与连接方式

组件样式的专属写法统一见 [样式文件写法](../../docs/style/样式文件写法.md)：先对照组件定义，再组织配置、名称、注释与末尾组装。这里不另维护一套 Button 命名或标题层级。

具名内容可为单个 Declaration 或嵌套集合，of 按顺序接收并保留节点身份。组件只导出实际需要的注册入口；节点的可控制能力不等于对外操作权限。

## Root 与浏览器提交

浏览器宿主先提供 style#css-root；调用者在它可用后执行 cssRoot.activate(kitStyle)。只 import Button 不激活；组件执行时同步注册，服务器端跳过，不等待通用 DOMContentLoaded 事件。

Root 在一次调用中建立激活闭包：沿 Block、Declaration 和复合 Value 的实际内容渲染，首次经过 Value 时执行 onActive，将返回 Rule 加入待处理集合并继续遍历，然后逐条 insertRule。

按对象身份去重，不按名称或文本合并；回到同一待处理 Rule 时终止该激活环。仅 insertRule 成功后记录已注册；失败原样抛出，重试能够补齐失败依赖而不重复成功规则或 onActive。不同 Root 独立登记。嵌套 Block 不另行提升到顶层。

Root 不拼接具体 CSS 语法。离线 parseCss 不触发激活；已提交 CSS 不重写、不卸载，动态视觉由 DOM 状态、条件和元素 style 上的变量取值表达。

## 尚未扩展的运行边界

- 已注册顶层 Block 继续 of 后，当前 Root 不自动提交累计变化；Block 不冻结，增量提交机制另行裁决。
- declareVariable 只产生定义；把定义直接应用到某个 DOM 元素的通用入口尚未加入，不另建 setTheme。
- 同名全局注册冲突的报告，以及 Button 之外的宿主生命周期另行裁决。
- onActive 只提供规则或规则集合，不增加 attachRoot、attachRule 等回调操作协议。

这些边界不妨碍明确范围内的实现，也不能被隐式订阅、兼容工厂或重写规则所绕过。

## 保留与验收

deriveable 与 lazyCopy 保留为独立通用能力，不重新覆盖所有 CSS 对象；需要对象派生时另行使用，不让 Block 的空调用暗含复制。

Style System 的 index 公开基础对象、选择条件和组合工具。values 与 declarations 只是分组目录，不拥有独立领域契约，不建立 index；使用方直接引用其中的具体文件。内部直接导入具体文件，不通过对外 index 绕行。旧的可调用 Block、可调用 Variable 和 namespace 包装退出正式使用链。

验收集中在关节：普通对象与类型约束、累计身份和隔离、递归集合、变量定义及使用的激活、@property、Keyframes、失败重试、真实 Button 挂载与 CSS 输出。具体属性和业务片段不逐个机械配套测试。保存修改前的完整 Button 规则和依赖输出，检查取值、顺序、变量接口及浏览器效果；测试通过不能替代扫读和职责检查。
