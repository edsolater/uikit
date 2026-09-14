本文保存 Style System 对象模型、组合方式、激活过程和浏览器提交边界的设计裁决。采用 Key、Value、Declaration、Block、Root 五个 CSS 角色；deriveable 只是对象派生手段。本轮已批准递归片段、选择器分步调用和结构化属性入口，并先迁移 Button；实际实现状态由 [architecture.md](architecture.md) 负责。

# 设计裁决

Stylesheet 中的 CSS 定义一旦注册便永久存在，只允许继续增加，不修改或卸载既有规则。运行中的视觉变化交给浏览器：伪类、class、data attribute 和条件规则负责状态选择，元素上的 CSS Variable 由 DOM style 更新；Style System 不为这些变化重写 Stylesheet。

CSS 对象按以下职责分开：

| 对象 | 职责 |
| --- | --- |
| Key | 表示可命名、可检索的 CSS 属性身份。 |
| Value | 承担 CSS 内容；只有 Value 能在激活波经过时执行 onActive。 |
| Declaration | 保存 Key 与 Value 的声明关系，负责冒号和分号，是独立语法节点。 |
| Block | 承担具体规则格式、层次，以及定义时已经声明的 body 和内部节点位置。 |
| Root | 在取得存活权限后同步激活整份定义，接纳新增 Block，坍缩并注册 CSS。 |

五个角色不能互相代替。Key 和 Value 不预先绑定；Declaration 建立声明关系；具体 Block 在构造时确定内部节点的位置；Root 不拥有 CSS 语法。用于组织资料的对象、数组和普通函数仍然只是 JavaScript 手段，不增加 CSS 角色。

Core 与 Tokens 各有自己的 index.ts，分别向 Style System 外部公开核心能力和通用样式材料。Button 等外部使用方通过入口导入；Style System 内部直接引用具体文件，Tokens 使用 Core 也不经过 index。入口只承担导出，不承载业务或注册。

Tokens 通过 `values`、`properties`、`variables` 和 `selectors` 命名空间公开共享取值、属性操作、变量接口和选择条件。前三个入口分别由 values、css-properties、css-variables 的 index.ts 汇总，selectors 直接来自同名文件；内部引用仍指向具体文件。样式上下文中不重复 CSS 前缀，公共变量成员也不带 component 前缀。组件不重新声明一套带组件名称的变量；共享变量的公共 fallback 与组件取值定义分开。

CSS Variable 的三个动作是声明、定义、使用：Tokens 调用 variable(name, options) 声明公共变量；组件调用 `variables.paddingY(value)` 定义它在当前规则中的取值，得到 Declaration；变量本身作为 Value 输入时自动坍缩为 var(...)。调用不修改变量对象或 fallback，不立即注册 CSS；定义进入 Root 的渲染路径时，变量及输入 Value 参与激活。可选 @property 注册与作用域内赋值不是同一件事。

两个规则可以定义同一个公共变量的不同取值；直接传入该变量时仍是引用。JS 成员名与 CSS 自定义属性名独立，`variables.paddingY` 仍对应 `--component-padding-y`。

`values.space` 提供固定间距尺度；`variables.space` 保留可通过 CSS 覆盖的间距阶梯，其默认值取自前者。选择固定值还是可覆盖的引用由使用方决定，不因命名空间调整而移除原有样式接口。

```ts
import { styleRule } from '../../../style-system/core'
import { properties, variables, values } from '../../../style-system/tokens'

const button = styleRule('.Button')(
  variables.paddingY(values.space.normal),
  properties.padding(variables.paddingY),
)
const input = styleRule('.Input')(
  variables.paddingY(values.space.small),
  properties.padding(variables.paddingY),
)
```

---

# Key

Key 是普通对象。构造时只确定 CSS 属性名，不接收 Value，也不产生 Declaration。

    const colorKey = key('color')

Key 对外使用 name 保存 CSS 属性名，key 的 const generic 保留该名称的字面量类型：

    colorKey.name // 'color'

key(name) 返回对象，不使用 Brand，也不把 Key 压成不可扩展的字符串。对象身份为未来关联 Key 留出承载位置；当前不引入子 Key 协议。简写属性的参数语义由属性函数负责，不由 Key 承担。

Key 不激活，不承担值内容，也不生成冒号和分号。

---

# Value

Value 承担能够进入 CSS 的内容。相同 Value 可以被不同 Key 和不同 Block 复用，不需要知道自己的属性名或最终位置。

只有 Value 具有 onActive。激活波第一次经过某个 Value 时，Root 同步执行其 onActive；回调可以返回一个新的 Block。这个返回值表示“只要该 Value 生效，这个 CSS 定义也必须存在”，不表示修改已有 CSS。

两个首要用例是：

- animation name Value 返回对应的 Keyframes Block；
- CSS Variable Value 返回注册该变量的 @property Block。

Value 不直接调用全局 Root，也不自行插入 CSS。Root 接收返回值，并把它加入当前激活过程。当前只采用“返回可选 Block”这一种入口；向回调传入 attachRoot、attachRule 等方法属于以后另行裁决的扩展。

具体数值、长度、颜色等内容先提取为可引用的 Value；属性关键字可直接传入字符串，由入口自动包装。不维护全局关键字或各属性的合法值名单，CSS 合法性由浏览器判断。复合 Value 保留子 Value 的实际引用，输出时逐项通过 parseValue 传递激活上下文，不在定义时拼成字符串。

值的提供方与使用方分开：同一个空间尺度可以用于 padding、margin 或边框宽度，不按使用属性复制一份值。单位表达数值的量纲，空间尺度、圆角半径等设计含义则由材料自身表达；相同单位或数值不意味着必须合并不同设计含义。

CSS Variable 是对外暴露的样式接口，不只是 JavaScript 常量的另一种命名。已有覆盖入口要保留，不以当前是否有调用方覆盖为删除依据；局部 Value 与公开 CSS Variable 可以同时存在，变量的默认值仍可引用共享材料。

---

# Declaration

Declaration 是独立语法节点，不是 Block。Key + Value = Declaration；Declaration 保存双方的实际对象，并负责将关系表达为 `key: value;`。

常用属性可以显式定义 Key，再用普通函数提供便捷入口：

    const colorKey = key('color')
    const color = (input: Value | string): Declaration<'color'> => declaration(colorKey, toValue(input))
    const colorDeclaration = color('blue')
    colorKey.name // 'color'
    colorDeclaration.key === colorKey // true

这里的 color 只是 JavaScript 函数，不是独立对象模型，也没有自身的 Key、状态或生命周期。基础 CSS 按系列保存明确命名的 Key 与属性函数，例如 marginTopKey 和 marginTop；一次性内部声明则可直接调用 declaration(key, value)。

Declaration 自己不激活，也没有 onActive。Root 沿规则坍缩经过 Declaration 时，Declaration 继续经过它包含的 Value；激活上下文由这条实际渲染路径传递，不另行登记值依赖。

## 属性参数

默认使用位置参数。各部分容易凭用途区分时，不为它们增加对象字段；只有角色容易混淆、或存在需要明确归属的特殊分隔关系时，才用非位置参数消除歧义。padding 的一至四个位置参数采用 CSS 原有顺序，也可显式指定方向：

```ts
padding(space)
padding(vertical, horizontal)
padding(top, horizontal, bottom)
padding(top, right, bottom, left)
padding({ top, right, bottom, left })
```

padding 对象形式只输出给出的方向，不为缺省方向补值或重置；位置形式输出完整 shorthand。border 的宽度、线型和颜色可以自然区分，直接用参数组成空格分隔的值，保留输入顺序，不识别或重排内容。font 的字号与行高可能使用相同单位，并通过 `/` 关联，用对象字段明确归属：

```ts
border(distance, 'solid', lineColor)
border('solid', lineColor, distance)
font({ size: fontSize, lineHeight, family: fontFamily })
```

位置参数或对象字段承载内容，属性函数承担 CSS 排列和分隔格式。判断依据是歧义，不是参数数量、是否混合类型或是否属于简写属性；也不建立通用的 CSS 类型识别器。不是将整个 border 或 font 包装为一个原始字符串，不新增 DeclarationCreator，不提前穷举 CSS。

---

# Block

Block 是声明式 CSS 组织体。内容在构造 Value、Declaration 和具体 Block 时已经确定；Block 负责这些内容之间的格式、层次，以及内部节点进入 body 的具体语法位置。内容入口接受单个节点和任意深度的有限集合；构造时按顺序展开集合，公开 readonly body，保留节点引用。后续修改来源数组不改变已定义结构。

数组嵌套只有 JavaScript 组织意义，不产生花括号，也不改变 CSS 归属。`a, b`、`[a, b]`、`[[a], [[b]]]` 输出相同；展开只穿过集合，不能拆掉具体 Block。调用方不需要知道片段是一个节点还是集合，不负责使用 spread。

## 选择条件与内容分开

styleRule 分两次调用：第一次绑定 selector，第二次通过 rest parameter 接收内容。部分应用后的普通函数可复用，但还不是完整 Rule；每次调用生成独立规则，不累计内容。

```ts
const hover = styleRule('&:hover')
const button = styleRule('.Button')
const buttonRules = button(layout, appearance, hover(hoverAppearance))
```

相对 selector 的 `&` 由最终 CSS 上下文解释，不由数组层数解释。其他具体 Block 同样允许其合法节点的递归集合；本轮只将 StyleRule 改为分步调用，不强制其他 header 采用同一函数形式。

不同 Block 对应不同 CSS 组织方式：

- Style Rule Block 组织 selector 和 declarations，产生规则花括号；
- Media Block 组织 condition 和内部 rules；
- Keyframes Block 组织 animation name 和 frames；
- Frame Block 组织时间位置和 declarations；
- @property Block 组织变量名和注册描述符。

具体 Block 只理解自己的语法，不能由一个通用 Block 根据“是否连接了子对象”猜测花括号、分号或合法位置。业务不填写字符串模板、slot 或连接标点。

Block 没有 isActive、activate、onActive、dependence 或 getDependencies。Block 也不通过 attach 管理运行关系；它在构造时已经是一份完整定义。

---

# Root

Root 是全局 CSS 注册入口。上级在 Root 已经取得存活权限、浏览器承载节点可用时调用：

    cssRoot.activate(wholeRules)

activate 代替 attach。这次调用不是建立可撤销的父子关系，而是让一份已经完成的 CSS 定义永久生效。

Root 在一次同步 JavaScript 调用中完成：

1. 接收入口顶层 Rule 及其任意深度的有限集合；
2. 沿 Block、Declaration 的实际坍缩路径访问其中的 Value；
3. 第一次遇到 Value 时同步执行 onActive；
4. 把 onActive 返回的 Block 纳入 Root，并继续激活该分支；
5. 重复以上过程，直到没有新增 Block；
6. 保留这条路径产生的每个完整顶层 Rule 字符串；
7. 激活闭包结束后，将本次新增 Rule 逐条追加到全局 Stylesheet。

Root 实例记录已经激活的 Value 和成功注册的顶层 Block，阻止同一对象重复执行或重复插入。只有 insertRule 成功返回才登记为已注册。激活状态属于 Root 的运行视图，不写回 Block。循环到达同一对象时由本次待处理集合终止，不依赖 Block 自己防重入。嵌套 Block 的出现位置属于外层定义，不作为额外顶层规则注册。

Root 不等待通用的 DOMContentLoaded 事件；何时调用由上级的存活关系决定。承载节点不可用时不能伪装成已经激活。

---

# 浏览器提交

Key、Value、Declaration 和 Block 在进入最终渲染路径前保留结构。具体节点的 parseCss(context) 在坍缩时继续传递激活上下文，parseValue(value, context) 报告实际经过的 Value。Root 收齐当前闭包的完整规则文本后，通过浏览器 Stylesheet API 追加。

不把整套 Style System 提前压成一个字符串，也不以逐项修改 CSSStyleRule.style 作为主要输出路径。字符串边界发生在完整 CSS Rule 提交之前；浏览器负责最终解析和合法性判断。

Block 的组织决定最终字符串。Root 调用 parseCss(context)，不自行拼接 selector、冒号、分号或花括号。

---

# deriveable

deriveable 给对象增加“从自身当前状态派生独立对象”的能力，是可选通用手段，不是五个 CSS 角色之外的新层次。

Key 是普通对象；属性便捷入口是普通 JavaScript 函数；Declaration 是由 declaration(key, value) 产生的具体节点。本轮 CSS 核心不使用 deriveable，独立定义由构造器表达；通用 deriveable 和 lazyCopy 的实现、测试继续保留，供后续需要对象派生的场景使用。

---

# 被覆盖的旧理解

以下旧理解已退出现役代码：

- 所有 Value、Property、Selector 都继承同一个可激活 Block；
- Block 同时保存 children、dependence、激活状态和解析方法；
- Block 通过 getDependencies 再声明语义字段中已经存在的关系；
- root.attach(block) 建立并保留可继续修改的连接；
- 活 Block 新增连接后继续传播激活；
- 修改已注册对象后刷新、替换或撤销既有 CSSOM。

替代后的实际运行链见 [architecture.md](architecture.md)。本轮只迁移 Button 及其所需的通用材料，旧 JSS 的其他消费者与其他组件不迁移。

---

# Button 迁移

Button.style.ts 从 Tokens 取得公共变量和值，通过调用公共变量定义尺寸、圆角、字重和语气分支的取值，再由 `styleRule('.Button')(...)` 连接属性与交互。共享选择条件、属性函数和公共材料属于 Style System，Button 的业务组合留在组件目录。不在 Button 内调用 variable 或 value 重新制造材料，不按语句机械拆文件。

保留现有 default、bare、solid、accent、danger、三档尺寸、loading、disabled、焦点、hover 和 active 的视觉能力与 CSS Variable 覆盖入口。状态分支显式组成规则，不恢复旧 JSS 的智能状态派生。运行中的连续变化通过 DOM style 赋变量，不更新已注册 CSS。

原组件专属 --button-* 名称改为共享的 --component-*，语气使用 --component-tone-*；覆盖能力保留，不为旧名称新增兼容转发。

模块加载只构建共享规则；Button 实际执行时沿 registerButtonStyle 调用 cssRoot.activate。服务器端不注册；浏览器宿主须先提供 style#css-root。Example 已有该节点，其余本仓库的 Button 宿主同步补齐。Root 不因这次迁移增加自动创建节点、卸载或重建机制。

---

# 未决问题

- Key 的关联子 Key 写法，以及尚未使用的 shorthand 扩展；
- Root 对同名但内容不同的全局注册如何报告冲突；
- Button 之外的上级通过什么生命周期入口授予 Root 存活权限；
- 除单个返回 Block 外，onActive 是否需要多个结果或 Root 操作上下文。

这些扩展在实际需要时继续裁决；不按名称去重，不将 Button 的接入方式推广为其他组件的既定生命周期。

---

# 实现验收

- key('color') 返回具有 name 的普通 Key 对象；declaration(colorKey, value) 得到独立 Declaration；常用属性函数只是对这次组合的 JavaScript 封装；
- Value 是唯一具有 onActive 的对象，回调同步返回的 Block 被 Root 自动接纳并继续激活；
- Declaration 自己不激活，负责声明标点并继续经过其 Value；
- Block 只承担具体 CSS 格式、层次与定义时 body 位置，不拥有激活、依赖或 Root 连接状态；
- cssRoot.activate(wholeRules) 在承载节点可用后同步完成激活闭包和新增 CSS 注册；
- 已注册 CSS 只增加，不修改或卸载；运行时变化通过 DOM 状态和 CSS Variable 表达；
- 完整顶层 Block 在最终边界坍缩为合法 CSS Rule，Root 不承担具体 CSS 语法；
- 重复引用同一 Value 或 Block 不会重复执行 onActive 或重复注册；
- 当前实现完成迁移后，architecture.md 与真实代码一致，浏览器测试验证 Keyframes、@property 和普通 Style Rule 的实际结果。
- 递归集合保持顺序、节点引用和 CSS 层次，复用 selector 不累计内容；复合属性的子 Value 继续参与同一激活波。
- Button 的真实渲染验证既有尺寸、变体、语气、交互、局部变量覆盖和重复挂载；测试集中在组合与挂载关节，不给每个属性或业务片段机械配套测试。
