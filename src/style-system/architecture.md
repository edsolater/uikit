# Style System 架构

本文件说明 Style System 当前的职责与运行链。对象语义和组件样式书写方式见 [设计](doc/样式系统对象与行为.md)，命名见 [命名](doc/样式系统命名.md)，可证伪的行为边界见 [__spec.md](doc/behaviors/__spec.md)。

## 从定义到浏览器

```text
Condition + Declaration(声明目标, Content) → Rules → CSSRoot
Rules → rules-to-style-nodes.ts → JSSStyleNode[]
JSSStyleNode[] → compiler/style-nodes-to-content-nodes/index.ts → JSSContentNode[]
JSSContentNode[] → content-nodes-to-css-string.ts → CSS string → 浏览器
```

Pieces 是可复用碎片的统称，不是 Rules 中的节点或编译阶段。Rules 包含 Condition 与 Declaration；Declaration 将声明目标和 Content 配对。`pieces/contents/` 对应内容这一侧：Value 与 Variable 在组合时统称 Atom，表示可作为一块使用的最小内容单元，不增加类型层。functions 按 [README.md](pieces/contents/functions/README.md) 中的 JSS 内容组织工具公约构造 Expression；Atom Creators 提供其他内容构造方式。

Expression 要求依赖与输出，禁止自身提供消费位置通知、AST 操作与资源定义；JSSContent 继续允许这些广义能力。CSSFunction 是与 Variable 同层的定义主体，保留签名与完整定义体；调用返回只依赖主体与实参的 Expression，主体的 `onActive` 通过既有依赖访问提供按需定义。对象身份用于共享主体，签名中的 CSS 名字与作用域用于同名定义接管，不增加 Symbol 或注册体系。

公开 Rules 与原始 Rules 的路径字符串统一转换成普通 Condition，不查询快捷名称表。Variable 创建时展开 `states` 中匹配到的快捷名称，其他输入直接作为条件，保存条件到内容的映射；自动展开直接消费这些条件，复用完整 `ConditionPath` 与既有节点编译链。快捷条件保留中央顺序，直接条件随后按书写顺序排列。资源 Rule 继续传递内部路径身份，不承担快捷名称解释。

`oklch({ lightness, chroma, hue, alpha })` 返回持有原始通道的 ExpressionValue，输出时生成普通颜色文本。[color-variable-modification.ts](color-variable-modification.ts) 保存颜色通道变化及其配方内容。`colorVariableModification(changes)` 将固定通道和回调保存在 `change`，构造时不执行回调；`onCompile` 读取当前 `change`，用 l/c/h/alpha 表达式执行通道回调，通过 `setContent` 提供配方 Expression，输出时生成整条通道文本。配方可保存在普通 Variable 中，来源色与变化分别复用。`modify` 用 `relativeOKLCH` 组合来源与配方 Variable（直接传描述时用描述自身），保留规则引用的状态与局部覆盖；`adjust` 直接解释通道配置，计算新的 OKLCH 数据。`relativeOKLCH(source, channels)` 只组织来源与通道内容，不解释变化。

[colors.ts](pieces/contents/atoms/color/colors.ts) 的 `toJSSColor` 将 Color System 材料包装为 Variable；私有 `createColorVariableModificationByDiff` 保存两份材料的通道差值回调，构造颜色 Modification。交互、柔和底色和线色直接描述变化，不先修改材料再回推差值。

Modification 只持有变化描述 `change`，不要求描述具备消费端的能力。[variable-modify.ts](variable-modify.ts) 的 `modify(variable, rule)` 返回 Declaration；编译消费时取得最近同对象声明的前序 Expression，直接执行表达式变化回调，或组合颜色配方，发布条件修改步骤。浏览器决定条件是否生效。Expression 可以附带 JS 求值能力，并非只用于 CSS。

[variable-adjust.ts](variable-adjust.ts) 的 `adjust(variable, rule)` 在调用时展开默认来源与 Value 包装：表达式回调处理当前数据的 Value，再由 `readNumber` 求得有限结果；通道配置按原 OKLCH 数据计算新通道。算完后创建独立 Variable，或在 `mutable` 模式更新原默认内容并返回原输入。新 Variable 使用匿名 CSS 名称，保留已解析状态、格式器、注册和按需行为，状态 Map 与注册配置容器独立；两种模式均不修改共享来源，失败不保存结果。Value 的 `withContent` 沿用原配置包装新数据。隐式 declare 每次编译读取当前默认值，显式 declare 保持自身内容；DOM 提交仍由应用显式编译或 mount。

`modification(change)` 只保存表达式变化回调，不执行或包装媒介应用。`add`、`multiply` 构造的 Expression 共享操作数：CSS 输出 calc 文本，`evaluateExpression` 执行已知数值算术；[calc.ts](pieces/contents/functions/calc.ts) 的 `readNumber` 是其 JS 求值辅助，复用 [variable.ts](variable.ts) 的 `readJSValue` 展开默认数据，再检查有限结果，不解析 CSS 字符串或执行普通生产函数。颜色描述另有用于配方内容的 `onCompile`。JS 调整不执行基础生产函数；固定通道可替换 CSS-only 内容，需要读取它的相对 JS 运算会失败。

`rule()`／`rules()` 登记源 Rules；`CSSRoot` 每次编译验证并展开源 Rules；给 `onActive` 的 root 另复制规则容器（Rules、tuple、路径及嵌套 Rules），保留业务对象身份。Atom、JSS 内容组织工具和 Atom Creator 的产物可进入内容位置。编译器按队列顺序遍历 Key 与 Content，只调用节点按需提供的 `onActive`、`onCompile` 和子内容链接，不识别具体业务对象。`onActive` 在内容被启用时通知并可返回按需 Rules。`onCompile(context, ast)` 是返回 void 的编译通知，编译器不读取返回值；回调通过 Controller 查询、插入、移动或删除节点，通过 `setContent(context, content)` 改写当前被通知的内容位置。嵌套内容各自处理，不覆盖外层声明。已经成功通知的对象跨波等待时不会重调。编译器沿设定内容与 `dependencies` 访问子内容，整条链完成后才产生 `JSSContentNode`；插入节点从下一波开始编译。Key、Content 或 revision 改变时，由同一失效规则分别在访问前和波末重置对应角色进度。

内部主线显式执行节点访问→资源发布→波末核验→稳定连接→输出。NodeCompilation 统一角色进度、输入失效和当前队列完成判断；ASTSession 保存唯一位置账本，每个角色按内容对象记录当前内容和通知完成状态，Controller、内容访问、Join 及输出读取同一份记录，不复制最终替代结果。visitContent 的 visit、compile、visitChildren 子步骤负责对象访问、编译通知、设定内容与依赖；ResourceCompilation 完整提交本波资源并保留激活账本；Join 负责同址连接、失效撤销与最新输出选择；单次连接由 captureInputs 捕获并校验回调前输入，createContent 建立位置 Value 视图并调用业务 Key.join，publish 接入结果与全部来源历史。三块沿同一份快照交接，连接入口保留先后顺序与是否需要生成的判断。调度入口不读取子步骤的私有索引。compiler/style-nodes-to-content-nodes/ 是节点到内容编译的领域目录，拥有共同的输入输出契约与编译规则；index.ts 只汇总公开编译函数与结果类型；compilation.ts 编排五阶段，node-compilation.ts 维护节点进度与单次内容访问，资源与连接在各自文件完整维护状态。外部从目录取得既有编译函数与结果类型，不深引内部成员或另加转发。等待事实只取当前输出队列，退出输出但仍存活的来源不阻止本波完成。

单次内容访问不建立临时实例，也不返回 visitor 对象；函数捕获该次真实回调环境，保留 AST 及内容回调的副作用。三个跨波编译节点各自保留类模板及实例账本，采用组合，不使用运行时继承；类型层继承允许。职责约束与状态有效期说明运行规则和生命周期，不能单独证明应使用类。

队列稳定时，Compiler 按最终 Target、State 与属性名收集同址重复内容；默认生成逗号数组 Value，或调用 Key 的 `join`。每项 Value 保留原内容并从自身已编译结果惰性读取，结果放在组内最后一项的位置并继续走编译波。同一聚合记录拥有有序输入的完整快照与结果历史；分组时建立本次位置表，结果历史末项是唯一最新输出。原输入保留为依赖来源。隐藏的旧结果仍是存活来源，其按需产物不会因结果隐藏而自动撤销；后续贡献可能依赖该产物，来源关系仍由 ASTSession 管理。

完整的 `conditionPath` 保存 `targetConditionPath`、规范化 `stateConditionPath` 与未排序的 `semanticPath`。语义归属沿原始父链判断，CSS 输出仍按状态中央顺序。编译器为每个声明角色建立输入快照，通知每个内容时通过 `JSSCompileContext.input` 标识该内容，并传入本次编译共用的 [ASTController](compiler/ast-controller.ts)。Context 同时提供节点引用、会话身份、地址、Key、Content、role 与读取状态；Controller 提供当前内容操作，以及显式位置和来源的队列操作。`setContent` 仅在对应通知期间有效，旧上下文不能写入后来的位置记录。ASTSession 区分存活来源与输出成员，拒绝已撤销来源，按来源关系级联撤销；退出输出的来源仍存活。当前编译波由编译器内部掌握，内容对象保留最早编译波配置。编译完成时，状态路径并入 CSS 输出地址；`JSSContentNode` 保留已完成的内容对象及同一份位置记录。最后一段才调用 `toCSSString` 并写出 CSS，不按 Variable 或依赖来源重排。暂缓只重试尚未完成的通知，不撤回已执行的内容或队列操作；当前输出队列只剩暂缓角色且没有新节点时，编译报告实际暂缓原因。循环引用、嵌套、操作和编译波超过上限时分别明确失败。

`declare(variable, value?)` 与 `modify(variable, modification, options?)` 返回 Declaration。Variable 保存默认值、状态与注册；Modification 直接持有 change 配置或回调，回调可捕获所需领域数据。修改器按最近同对象语义声明归属，按当前节点顺序保存步骤。每步保留一个结果变量，前序内容在输出时解析，不建立输入别名或双向步骤链。步骤及不继承存在标记的注册资源归属该步的默认选择门节点，基础注册归属根消费地址的结果引用，复用 AST 的来源级联撤销。

局部声明发布基础值与状态值，并接管同归属的自动产物。修改声明在编译消费时直接执行变化回调或组合颜色配方，生成新 Expression，步骤按存活成员的当前节点位置排序；重访、业务回调和撤销共用有序步骤更新。晚到或撤销声明重新确定修改和普通消费者的归属，前序内容随最终顺序解析。

已编译步骤移动后，调用方显式增加 revision 才触发重访。编号只保证名称唯一。晚到或撤销定义让对应修改及普通消费者重新进入最近声明，按现役 `onCompile/onActive` 推进。没有独立 Rewriter 协议、操作转发或整组表达式缓存。

`Value` 包装内容但不自行选择 Variable 状态。`Variable.onCompile()` 在普通消费时读取同一 Variable 对象的 `config`，插入 `@property` 和自身状态定义，并通过 `setContent` 设定带 CSS `var()` 回退值的内容表达式；Variable 生成状态声明时把选中的状态随内容节点交给编译器；编译器从内容入口沿设定内容和 `dependencies` 传递该状态。嵌套来源 Variable 按同名状态读取内容，缺失则读取默认内容；来源其他状态不会进入该声明。普通 Rule 消费仍保留 CSS 引用。Variable 的嵌套引用通过 Content 链编译。根声明由需要它的具体 Atom 通过普通 Condition Rule 按需提供。可组合定义的状态先写入内部 base，再应用修改；`registration` 的类型约束同步到内部步骤；字段内容由 variable.ts 统一生成，普通引用与内部步骤各自保留激活、位置、来源及撤销责任。`VariableCluster` 代理默认 Variable 的对象属性和编译接口，选择和双方同名成员配对由 Cluster 自身负责。`clusterFrom` 按同名来源成员建立普通 Variable，保留来源状态引用并应用本组覆盖；未配置成员复用原对象。JSS 内容组织工具与 Atom Creator 构造的内容通过 `dependencies` 暴露操作数，在最终输出时生成 CSS 文本。Creator 新配置通过整份内容重建及 `RuleHandle.replace` 消费，新内容与依赖一起重新编译。

[rules-to-style-nodes.ts](compiler/rules-to-style-nodes.ts) 从 Rules 建立样式节点队列；[内容编译流程](compiler/style-nodes-to-content-nodes/compilation.ts) 逐波编译、处理按需 Rules 和同址组合；[content-nodes-to-css-string.ts](compiler/content-nodes-to-css-string.ts) 按内容节点顺序输出 CSS。按需 Rules 回到第一步建立节点，再进入下一编译波。依赖按完整地址替换，未被消费的 Value、Variable、函数、动画和自定义资源不进入 CSS。同址同名 Key 默认组合，单条声明仍直接输出。

修改保留为完整变化描述；原 selector 只选择当前步骤的候选，空 token 与 `initial` 选择门由 CSS 原生层叠和继承。修改地址及普通消费地址当地生成阶段结果，每阶段只引用前序 CSS 变量。未显式声明的后代继承规则选择，显式 `declare` 建立独立基础与修改归属；不解析选择器或复制祖先状态。`registration.inherits: false` 通过不继承的当地存在标记阻止消费链重新应用祖先修改，前序与最终引用保留注册基础值回退。

`compileCSS()` 只返回 CSS 字符串。`cssRoot.mount()` 保留宿主已有前缀，结果未变化时不重写，编译失败时保留此前提交。测试登记通过句柄清理。

## 文件职责

| 位置 | 职责 |
| --- | --- |
| condition.ts | Condition、完整 `conditionPath`、目标与状态子路径，以及 CSS 输出地址与地址身份 |
| pieces/state-conditions.ts | 主体状态名称、条件登记、中央顺序与状态路径追加 |
| key.ts | JSSKey 的创建、可选聚合协议、声明目标识别与名称解析 |
| declaration.ts | declare 入口，Key 配对及 Variable 局部基础声明 |
| rule.ts | 声明组合、Rules 登记与句柄 |
| content.ts | 广义 JSSContent、窄 Expression、子内容读取与表达式构造 |
| value.ts | 稳定 Value 的内容包装与输入类型 |
| variable.ts | Variable 创建、引用、状态与注册，共享默认来源与 Value 数据展开 |
| variable-modify.ts | modify 入口、局部声明基础值、有序修改步骤及撤销 |
| variable-adjust.ts | adjust 入口，JS 基础数据求值与新 Variable 创建或 mutable 默认内容更新 |
| modification.ts | Modification 变化描述与表达式回调的保存入口 |
| color-variable-modification.ts | 颜色通道配置的变化描述、消费期配方内容编译与共享通道解释 |
| css-function.ts | CSSFunction 定义主体、按需完整定义与调用 Expression |
| variable-cluster.ts | Variable 成员选择、default 代理、同名声明配对及成员继承创建 |
| css-root.ts | 源账本、三步编译调用和宿主提交 |
| compiler/rules-to-style-nodes.ts | 将 Rules 展开为有序 JSSStyleNode 队列 |
| compiler/resource-rule.ts | 内部按需 Rule 与既有完整条件路径的身份关联 |
| compiler/style-nodes-to-content-nodes/index.ts | 汇总公开编译函数与 JSSContentNode 结果类型 |
| compiler/style-nodes-to-content-nodes/compilation.ts | 组合三项编译账本，编排访问、资源发布、波末核验、聚合和输出 |
| compiler/style-nodes-to-content-nodes/node-compilation.ts | 节点角色进度、输入失效、单次内容链访问、完成判断及内容节点结果 |
| compiler/style-nodes-to-content-nodes/resource-compilation.ts | 内容激活、当前 Rules 身份关联、共享消费者与同址资源完整提交 |
| compiler/style-nodes-to-content-nodes/join.ts | 同址贡献收集、回调前输入快照、位置 Value 视图、连接、历史撤销与最新输出选择 |
| compiler/ast-controller.ts | 通用节点查询、声明插入、位置调整、撤销生命周期与依赖来源 |
| compiler/content-nodes-to-css-string.ts | 惰性读取已编译内容，并按 JSSContentNode 队列顺序输出 CSS 字符串 |
| pieces/keys | 可复用的 JSSKey 定义；创建时由 key() 登记名称与别名 |
| pieces/conditions | 可复用的普通 Condition；条件协议由 condition.ts 定义 |
| pieces/contents/atoms | 按用途组织的现成 Value 与 Variable |
| pieces/contents/functions | 遵守 JSS 内容组织工具公约的混色、计算和相对颜色等 Expression 构造 |
| pieces/contents/functions/calc.ts | 算术 Expression 构造及有限 JS 数值求值辅助 readNumber |
| pieces/contents/functions/relative-oklch.ts | 来源颜色与通道内容的纯相对 OKLCH 组合，不解释 Modification 或 Variable |
| pieces/contents/functions/README.md | JSS 内容组织工具公约与 Expression、规则及定义主体的边界 |
| pieces/contents/atom-creators | 按结构生成阴影、动画等内容 |
| pieces/roles | 供组件在自身选择器中赋值的共享角色 |
| pieces/mixins | 把完整效果转换成声明组合 |
| test | 验证 Style System 多文件协作与完整业务流程 |
| doc | 面向使用和设计阅读的对象契约 |

公共 `index` 公开 Variable 创建、Cluster 聚合与成员继承、声明、编译和 Mixin。Key 和其他碎片从负责文件导入；Variable 类型直接包含创建配置 `config`，自动状态声明 Key 位于 `config.definitionKey`。

## Button 接入

Style System 是抽象层，包含可复用碎片和面向组件的通用定义。是否通用取决于描述目标与领域，不取决于当前消费者数量。

`Button.style.ts` 拥有 Button 的选择器、variant、tone、size、status 与组件差异。语义配色由 `interactiveColor`、`highlightColor`、`badColor`、`toneColor` 等 Cluster 提供；Button 通过声明选择整组成员，不读取 Cluster 内部定义。

[Button.style.ts](../components/kits/Button/Button.style.ts) 同时定义公开的色源、画布、背景强度控制点与业务规则。控制点以 export 定义，组件入口导出同一 Variable 对象，样式直接消费。色源与画布支持局部 declare，强度支持 declare／modify。底层工具提供通用操作语义，业务规则决定分类如何选择材料与加入贡献；专属 opacity 已退出，禁用淡化复用 clickable 默认策略。当前控制仍通过 Rules 登记与应用挂载执行，未实现运行时变值自动插入 CSS。

Button 的背景来源与画布由分类选择，强度 Variable 持有状态，bare／solid 的贡献通过既有 modify 组合。tone 选择成员材料，前景直接声明共享角色；组件不登记逐状态消费 Rule，也不登记 variant×tone 交集配方。验收关注退场、突出、层次和状态反馈，旧实现的混色系数不作为约束。

Button 静态导入自身样式；Example、Storybook 和缩略图入口在 render 前统一挂载。懒加载样式仍由应用样式清单负责提前登记。

## 验证

同目录测试只验证同名源码文件自身的业务契约，文件名以对应源码名加 `.test.ts` 或 `.browser.test.ts` 构成。跨文件协作及 Style System 整体流程的测试放在 `test/`，用中文描述验证目的并保留英文测试后缀；归属仍由断言对象决定。

单元测试覆盖 Value、Variable、Cluster、Controller/波次、声明、依赖、循环和顺序。浏览器测试验证状态优先级、Cluster 多成员继承、局部覆盖、CSS 函数局部定义，以及 Button 的现有配方和交互。测试通过后仍需检查归属、阅读顺序与不必要机制。
