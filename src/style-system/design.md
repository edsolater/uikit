本文保存 Style System 对象模型、激活过程和浏览器提交边界的设计裁决。采用 Key、Value、Declaration、Block、Root 五个 CSS 角色；deriveable 只是对象派生手段。五角色核心已实现，当前代码事实由 [architecture.md](architecture.md) 负责，未裁决扩展留在本文。

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

---

# Key

Key 是普通对象。构造时只确定 CSS 属性名，不接收 Value，也不产生 Declaration。

    const color = key('color')

Key 对外使用 name 保存 CSS 属性名，key 的 const generic 保留该名称的字面量类型：

    color.name // 'color'

key(name) 返回对象，不使用 Brand，也不把 Key 压成不可扩展的字符串。对象身份为未来关联 Key 留出承载位置，例如 font.family、font.size；当前只确认这种扩展方向，不预先定义 shorthand 的展开、重置或约束规则。

Key 不激活，不承担值内容，也不生成冒号和分号。

---

# Value

Value 承担能够进入 CSS 的内容。相同 Value 可以被不同 Key 和不同 Block 复用，不需要知道自己的属性名或最终位置。

只有 Value 具有 onActive。激活波第一次经过某个 Value 时，Root 同步执行其 onActive；回调可以返回一个新的 Block。这个返回值表示“只要该 Value 生效，这个 CSS 定义也必须存在”，不表示修改已有 CSS。

两个首要用例是：

- animation name Value 返回对应的 Keyframes Block；
- CSS Variable Value 返回注册该变量的 @property Block。

Value 不直接调用全局 Root，也不自行插入 CSS。Root 接收返回值，并把它加入当前激活过程。当前只采用“返回可选 Block”这一种入口；向回调传入 attachRoot、attachRule 等方法属于以后另行裁决的扩展。

---

# Declaration

Declaration 是独立语法节点，不是 Block。Key + Value = Declaration；Declaration 保存双方的实际对象，并负责将关系表达为 `key: value;`。

常用属性可以显式定义 Key，再用普通函数提供便捷入口：

    const colorKey = key('color')
    const color = (value: Value): Declaration<'color'> => declaration(colorKey, value)
    const colorDeclaration = color(value('blue'))
    colorKey.name // 'color'
    colorDeclaration.key === colorKey // true

这里的 color 只是 JavaScript 函数，不是独立对象模型，也没有自身的 Key、状态或生命周期。基础 CSS 按系列保存明确命名的 Key 与属性函数，例如 marginTopKey 和 marginTop；一次性内部声明则可直接调用 declaration(key, value)。

Declaration 自己不激活，也没有 onActive。Root 沿规则坍缩经过 Declaration 时，Declaration 继续经过它包含的 Value；激活上下文由这条实际渲染路径传递，不另行登记值依赖。

---

# Block

Block 是声明式 CSS 组织体。内容在构造 Value、Declaration 和具体 Block 时已经确定；Block 负责这些内容之间的格式、层次，以及内部节点进入 body 的具体语法位置。构造器复制传入的 body 列表，对外提供 readonly body；后续修改来源数组不改变已定义结构。

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

1. 接收入口顶层 Rule 或 Rule 数组；
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

替代后的实际运行链见 [architecture.md](architecture.md)。旧 JSS 及组件迁移不属于本轮范围。

---

# 未决问题

- Key 的关联子 Key 写法，以及 shorthand 的真实语义；
- Root 对同名但内容不同的全局注册如何报告冲突；
- 上级通过什么现役生命周期入口授予 Root 存活权限；
- 除单个返回 Block 外，onActive 是否需要多个结果或 Root 操作上下文。

这些扩展在实际需要时继续裁决；本轮不推断 shorthand，不按名称去重，也不替组件确定存活入口。

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
