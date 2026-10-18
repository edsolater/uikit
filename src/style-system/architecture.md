# Style System 架构

本文件说明 Style System 当前的职责与运行链。对象语义和组件样式书写方式见 [样式系统对象与行为.md](doc/样式系统对象与行为.md)，命名见 [样式系统命名.md](doc/样式系统命名.md)，可证伪的行为边界见 [__spec.md](doc/behaviors/__spec.md)。

## 从定义到浏览器

```text
Condition + Declaration(声明目标, Content) → Rules → CSSRoot
Rules → rules-to-style-nodes.ts → JSSStyleNode[]
JSSStyleNode[] → compiler/style-nodes-to-content-nodes/compilation.ts → JSSContentNode[]
JSSContentNode[] → content-nodes-to-css-string.ts → CSS string → 浏览器
```

Pieces 是可复用碎片的统称，不是 Rules 中的节点或编译阶段。Rules 包含 Condition 与 Declaration；Declaration 将声明目标和 Content 配对。`pieces/contents/` 对应内容这一侧：Value 与 Variable 在组合时统称 Atom，表示可作为一块使用的最小内容单元，不增加类型层。functions 按 [SPEC.md](pieces/contents/functions/SPEC.md) 中的 JSS 内容组织工具公约构造 Expression；Atom Creators 提供其他内容构造方式。

Expression 要求依赖与输出，禁止自身提供消费位置通知、AST 操作与资源定义；JSSContent 继续允许这些广义能力。CSSFunction 是与 Variable 同层的定义主体，保留签名与完整定义体；调用返回只依赖主体与实参的 Expression，主体的 `onActive` 通过既有依赖访问提供按需定义。对象身份用于共享主体，签名中的 CSS 名字与作用域用于同名定义接管，不增加 Symbol 或注册体系。

公开 Rules 与原始 Rules 的路径字符串统一转换成普通 Condition，不查询快捷名称表。Variable 创建时展开 `states` 中匹配到的快捷名称，其他输入直接作为条件，保存条件到内容的映射；自动展开直接消费这些条件，复用完整 `ConditionPath` 与既有节点编译链。快捷条件保留中央顺序，直接条件随后按书写顺序排列。资源 Rule 继续传递内部路径身份，不承担快捷名称解释。

`oklch({ lightness, chroma, hue, alpha })` 返回持有原始通道的 ExpressionValue，输出时生成普通颜色文本；`oklch(source, { lightness: current => add(current, -0.04) })` 返回相对颜色 Expression，直接接收通道变化，未指定通道保留来源，不创建 Modification 或 Variable。`Modification<Detail, Type>` 是通用变化定义，持有 type/name/detail 及声明内容，不继承颜色材料；通用构造按 type 选择私有转译策略，名称和声明生命周期共用。Color 的材料形状与策略连接集中在文件后部，通道参数与源无关转译复用 `oklch.ts`；加入其他领域时扩展对应描述和策略，不改通用对象。[modification.ts](modification.ts) 通过单个配置保存 `name`、`type: 'color'` 与 `detail`，显式 name 使用完整 CSS 自定义属性名（例如 `--change`），内置转译在配方编译时用 l/c/h/alpha 表达式执行通道回调，输出与来源无关的通道配方。固定值设定通道，未指定通道保留来源；构造时不执行回调。Modification 持有 Declare、Adjust、Modify 所需的自然材料，可通过 `declare(change)` 独立声明，不需要 Variable 包装或独立 Adapter 层。`oklch(source, channels)` 也接受完整通道内容，为独立配方保留 CSS 引用；外层 Expression 只组织依赖与输出，直接通道配置由依赖自身在编译时转译，不插入声明或资源。

[ui-color-structure.ts](pieces/contents/atoms/color/ui-color-structure.ts) 的 `toJSSColor` 将 Color System 材料包装为 Variable；普通转换函数按具体来源创建所需变量。交互、高亮、柔和底色和线色通过 `oklch(source, changes)` 直接描述通道变化，保留来源 Variable 的当前颜色与局部覆盖。

`operations/` 只按声明、修改、调整三个操作入口分组，不建立独立公共入口；Style System 的 index 直接公开各操作及其协议。Variable 的创建、声明发布、修改链和依赖协调归 `variable/` 领域；通用 AST 编译能力留在 `compiler/`，变化材料留在 `modification.ts`。

Variable对象持有自己的默认内容、状态及定义消费材料。值引用输出var()并激活当前对象，Name只表示CSS地址：字符串化返回不带--的逻辑名，作为内容只输出var()，不查找或激活同名定义。derive沿用创建时默认/状态，名称默认沿用，priority默认来源加一；完整配置差异通过derive(source.content, options)表达，普通variable创建入口没有继承参数。

variable/dependency.ts沿原有usages/defaults/links协调实际消费与当地物化，观察索引直接以具体Variable为键。默认和状态的实际展开内容通过getCompiledContent/getContentCompilation读取，不为建图再次执行生产函数。纯Name不形成对象关系；同名对象不相互借用状态或自动接管引用。CSS地址仍用于真实声明聚合、注册资源和层叠。

variable/declare.ts保留同对象声明归属、当前基础、状态绑定和消费者重访。每个声明只展开所属对象状态；修改沿最近语义父声明取得基础，来源退出时按AST所有权释放当地修改结果。自动投影和linked声明保留真实originNode/sourceCompilation/rule身份，先撤旧再按新事实建立产物。多个来源和状态组合不退化成同名关联。

普通无参内容函数沿内容编译链延迟执行，可调用JSSContent遵守自身协议。每个角色保存实际访问的依赖与替代记录；输入或revision改变时失效重建。Join与自动投影复用该位置的已编译视图，不反复调用业务生产函数；编译结束仅输出CSS，不生成运行时JS观察网络。

Modify与Adjust仍分别处理相对变化及独立配方绑定。每阶段引用前序CSS变量，显式declare建立当地基础和修改归属；registration.inherits:false保留当地存在标记及注册初值边界。删除组适配不改变这些用途。

compileCSS只返回字符串；cssRoot.mount保留宿主前缀，内容未变不重写，编译或提交失败保留此前成功结果。

## 文件职责

| 位置 | 职责 |
| --- | --- |
| condition.ts | Condition、完整 `conditionPath`、目标与状态子路径，以及 CSS 输出地址与地址身份 |
| pieces/state-conditions.ts | 主体状态名称、条件登记、中央顺序与状态路径追加 |
| key.ts | JSSKey 的创建、聚合、识别与别名解析；共用 CSS 自定义属性名称分配，别名登记与名称避让分别保存 |
| variable/name.ts | CSS名称对象、逻辑名字符串化及纯CSS引用；不登记定义 |
| variable/args-parser.ts | 默认/状态/名称简写归一，接收内部派生来源；等级为显式值、来源加一或0 |
| operations/declare.ts | Declare 材料形状、declare 入口，Key 配对及自然材料声明 |
| rule.ts | 声明组合、Rules 登记与句柄 |
| content.ts | 广义 JSSContent、窄 Expression、子内容读取与表达式构造 |
| value.ts | 稳定 Value 的内容包装与输入类型 |
| variable/index.ts | Variable 领域主动公开的创建、引用、材料类型和操作接入契约 |
| variable/core.ts | 具体Variable创建与derive、名称身份、对象自身定义消费、共同声明依赖与注册资源 |
| variable/declare.ts | 公共声明基础、自身状态、消费者改绑与精确撤销；保留Key.join |
| operations/modify.ts | Modify 双方协议、材料校验、领域应用策略与操作内容构造 |
| variable/modify.ts | 执行已选应用、按需修改步骤、结果消费与撤销；引用公共声明 |
| variable/dependency.ts | 具体对象消费、默认请求、当地派生与联动资格及退出 |
| operations/adjust.ts | Adjust 双方协议、来源与变化的 CSS 绑定、结果 Variable 创建及共同声明关系材料 |
| modification.ts | Modification 的 type/detail 定义、内置颜色转译、独立声明与应用材料 |
| css-function.ts | CSSFunction 定义主体、按需完整定义与调用 Expression |
| css-root.ts | 源账本、三步编译调用和宿主提交 |
| compiler/rules-to-style-nodes.ts | 将 Rules 展开为有序 JSSStyleNode 队列 |
| compiler/resource-rule.ts | 内部按需 Rule 与既有完整条件路径的身份关联 |
| compiler/style-nodes-to-content-nodes/compilation.ts | 汇总公开编译函数与 JSSContentNode 结果类型 |
| compiler/style-nodes-to-content-nodes/compilation.ts | 组合三项编译账本，编排访问、资源发布、波末核验、聚合和输出 |
| compiler/style-nodes-to-content-nodes/node-compilation.ts | 节点角色进度、输入失效、单次内容链访问、完成判断及内容节点结果 |
| compiler/style-nodes-to-content-nodes/resource-compilation.ts | 内容激活、当前 Rules 身份关联、共享消费者与同址资源完整提交 |
| compiler/style-nodes-to-content-nodes/join.ts | 同址贡献收集、回调前输入快照、位置 Value 视图、连接、历史撤销与最新输出选择 |
| compiler/ast-controller.ts | 节点查询、实际内容记录与位置视图读取、声明编辑及撤销生命周期 |
| compiler/compiled-value.ts | Join 与自动投影共享的已编译位置 Value 视图，不重新求值原内容 |
| compiler/content-nodes-to-css-string.ts | 惰性读取已编译内容，并按 JSSContentNode 队列顺序输出 CSS 字符串 |
| pieces/keys | 可复用的 JSSKey 定义；创建时由 key() 登记名称与别名 |
| pieces/conditions | 可复用的普通 Condition；条件协议由 condition.ts 定义 |
| pieces/contents/atoms | 按用途组织的现成 Value 与 Variable |
| pieces/contents/functions | 遵守 JSS 内容组织工具公约的混色、计算和相对颜色等 Expression 构造 |
| pieces/contents/functions/calc.ts | 保存操作数依赖，构造 CSS calc 算术 Expression |
| pieces/contents/functions/oklch.ts | 普通与相对 OKLCH 表达式、通道配置及共享的源无关通道转译 |
| pieces/contents/functions/SPEC.md | JSS 内容组织工具公约与 Expression、规则及定义主体的边界 |
| pieces/contents/atom-creators | 按结构生成阴影、动画等内容 |
| pieces/roles | 供组件在自身选择器中赋值的共享角色 |
| pieces/mixins | 把完整效果转换成声明组合 |
| test | 验证 Style System 多文件协作与完整业务流程 |
| doc | 面向使用和设计阅读的对象契约 |

公共 `index` 公开 Variable 与独立 VariableName 创建、derive定义复用、声明、编译和 Mixin。Key 和其他碎片从负责文件导入；Variable 类型直接包含创建配置 `config`，自动状态声明 Key 位于 `config.definitionKey`。

## Button 接入

Button.style.ts拥有Button具体颜色、条件及公开控制点。基础纸色、墨色、品牌色等材料与普通转换留在Style System；组件不经全局中转角色取得自己的表面、内容和边线定义。lineColor(base)是普通函数，lineStrength是可全局/局部控制的Variable。

普通/危险语气通过同一rules中的并列declare分别选择buttonToneColor、buttonSoftColor、buttonStrongColor、buttonLineColor与buttonToneContentColor。原有浅底0.14、轮廓0.44和背景强度配方保留，plain/filled贡献继续用modify。Button表面、内容、来源、画布和强度均为具体对象，组件入口导出实际控制点。

clickable的focusColor接收组件的具体边线；轮廓构造函数据所选内容创建有自身focus状态的Variable。布局、禁用淡化、按压和焦点仍由通用效果承担，不建立共享颜色组。Button静态导入样式，应用在render前统一mount。

## 验证

同目录测试验证单文件契约，领域test/验证协作行为。单元测试覆盖对象隔离、Name纯引用、derive、默认/状态、编译波、资源、修改/调整、条件与失效清理；浏览器测试验证双基础转换与全局/局部强度、后代物化、状态组合、独立颜色声明及真实Button的普通/危险/hover/active/disabled/focus。
