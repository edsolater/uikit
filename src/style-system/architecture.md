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

variable/dependency.ts分开处理根默认、消费处自身状态和当地输入触发的基础联动。根清单按CSS名称检查完整单层`:root`与`:where(:root)`，已有声明保留，缺少才发布创建默认；根兜底不展开状态，也不参与当前定义选择。纯消费不复制当地基础，实际引用的任一输入在当地声明后才联动，其余输入继续继承。

variable/declare.ts从同对象的declare材料或原始二元声明选择最近结构父路径，同址按priority和书写顺序选择。状态和聚合产物不充当原始声明，linked只作为当地声明事实供后续联动；其原始输入与origin仍来自业务定义。当前基础固定20时，自身状态以20生成，不恢复创建公式。修改链继续沿已选声明连接，linked沿用该声明的动态基础槽，首个Modify进入及末个撤销都不另建Variable身份。

Variable与天然材料的referenceVariable包装通过core内部身份记录交付原对象，不按CSS名反查依赖。实际展开内容通过getCompiledContent/getContentCompilation读取，不为探测依赖再次执行生产函数。默认、状态、联动共享AST的depend/onRemove生命周期；表达式替换、同址显式声明接管时撤销旧联动及其资源。纯Name仍只输出CSS引用，同名对象不借用对方状态。

实际引用链从原生CSS消费开始，沿具体sourceNode的有效消费记录扩展，显式基础里的中间引用和状态内容走同一队列。状态材料来自已选声明或当前消费Address的状态容器，不借共享祖先基础激活其他地址；已展开状态只继续实际引用。既有状态联动的同址展开可引出新引用，来源属于linked联动产物的观察只补新边，不反写原始入口，避免产物改变配方归属后反复撤建。声明包装与发布基础共享同一份材料；当地联动只把实际baseNode及状态节点作为输入来源，包装不另起重复链。

ASTSession提供当前节点的初始登记及加入、可写输入改写、移动和退出通知，顺序由AST维护。插入时先完成initialize中的领域归属，再接入队列并通知观察者；Variable基础、状态、联动、Modify结果及Join聚合共用此时机，不在发布后补角色和重复登记。NodeCompilation只访问新增、改写及尚未完成的位置；已有节点在本波轮到前改变仍按原顺序处理，新生成节点进入下一波。Variable声明管理按具体对象索引原始声明和实际基础/状态位置，根清单随AST事实更新，不再由每个消费者搜索全部节点。

依赖协调分别保存待分析消费、待保障默认/自身状态及待联动声明位置。消费改变先退出旧引用边，再沿现有受体分析受影响需求；新的引用边把既有实际输入位置列为待办，不能漏掉后来出现的受体。撤旧后只重访相关位置，不逐个删除并重放整批输入；级联失效由声明索引确认。消费记录可反复替换，依赖跟踪和声明绑定各自的onRemove只在节点首次登记时安装一次，撤销时读取当前关系。联动状态定位索引与来源账本共享同一产物，不复制声明值或建立运行时DOM观察。已就绪的默认、声明和联动同轮推进；待办耗尽后结束。内容协议用固定字段检查，Join在输入未变化时保留原结果。

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
| variable/core.ts | 具体Variable创建、derive与variant、名称身份、对象自身定义消费、共同声明依赖与注册资源 |
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
| compiler/style-nodes-to-content-nodes/node-compilation.ts | 受影响节点队列、角色进度、输入失效、单次内容链访问、完成判断及内容节点结果 |
| compiler/style-nodes-to-content-nodes/resource-compilation.ts | 内容激活、当前 Rules 身份关联、共享消费者与同址资源完整提交 |
| compiler/style-nodes-to-content-nodes/join.ts | 同址贡献收集、回调前输入快照、位置 Value 视图、连接、历史撤销与最新输出选择 |
| compiler/ast-controller.ts | 节点变化与顺序事实、节点查询、实际内容记录与位置视图读取、声明编辑及撤销生命周期 |
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


Variable 的 options.variants 保存变体规则或固定值，参数解析与 states 一样合并创建时定义。variant 通过已有 derive 创建普通 Variable，再去掉父层变体；消费与依赖继续走现役链。Button 的用途表达式明确引用 buttonToneColor，分类只声明该输入，无额外母子联动设施。

## 内容扩展与位置记录

本节接收原doc/JSS样式节点树.md中的现役内部说明。公开扩展的输入、返回、同步位置、等待和撤销结果分别由[位置改写](doc/behaviors/内容改写只影响本次消费位置.md)、[节点编辑](doc/behaviors/节点编辑保留显式位置与来源.md)、[延后完成](doc/behaviors/延后内容完成后再交付结果.md)负责；这里记录当前机制，不将节点字段、内部数量或算法固定为对外承诺。

### 节点队列

```ts
interface JSSStyleNode {
  conditionPath: {
    targetConditionPath: Condition[]
    stateConditionPath: StateCondition[]
  }
  key: JSSKey | undefined
  content: unknown
  compileRevision: number
  deferredReason?: Error
  resourceAddress?: string
  productTag?: object
}
```

队列位置决定 Rule 声明顺序。`targetConditionPath` 表示 `.button`、`@media` 等普通条件地址；`stateConditionPath` 使用已登记的状态身份表示受体状态，例如 `hover`。编译器只把值都带入完整身份，不从 CSS 字符串推断状态。

每个 `JSSStyleNode` 的 Key 和 Content 都在其自身位置编译。Content 可以是字面值或 `JSSContent`；Value 与 Variable 在组合时统称 Atom，Atom 不增加对象类型。JSS 内容组织工具和 Atom Creator 也可构造作为一块使用的内容。Compiler 只调用对象按需提供的 `onActive`、`onCompile(context, ast)`、`dependencies` 和 `toCSSString`，不按碎片分类分支处理。`onCompile` 是返回 void 的生命周期通知，编译器不读取返回值；对象通过 Controller 插入后续节点或设定当前内容。未设定新内容的对象继续消费自身依赖及输出能力，没有输出能力则不输出当前声明。纯字符串、数字与已完成的对象链直接结束该位置。只有链上所有对象都已编译或无需编译后，节点才成为 `JSSContentNode`。

```text
Rules → JSSStyleNode[] → 逐波编译并改写当前队列 → JSSContentNode[] → CSS string
```

编译器调用 `onCompile(context, ast)`：`JSSCompileContext` 提供本次声明角色开始时的输入，`ASTController` 提供本次编译共用的队列操作。两者分别传入，不把当前位置绑定在 Controller 上。

```ts
onCompile(context, ast) {
  ast.insert(
    { before: context.node, conditionPath: context.conditionPath },
    ['width', '8px'],
    { owner: context.node },
  )
}
```

`context.node` 是可改写节点引用，`conditionPath`、`key`、`content` 是角色开始时的输入快照；改写 `node` 不改变这些快照。`context.input` 是当前被通知的内容对象，嵌套内容各自取得自己的通知上下文。`role` 区分声明目标与声明内容。设定内容及 `dependencies` 沿用声明角色的输入快照。`context.session` 是本次编译的不透明稳定身份，供消费者保存私有状态。Controller 不携带以上字段，也不携带当前编译波。

## 节点查询编辑与撤销

当前Controller把这些操作交给同一编译会话；公开参数及可观察效果由[节点编辑行为](doc/behaviors/节点编辑保留显式位置与来源.md)负责：

| 目的 | 调用 |
| --- | --- |
| 设定当前内容 | `setContent(context, content)`；只改写本次通知的内容位置，不覆盖外层声明或其他消费位置；显式 undefined 使此处不输出 |
| 查询有序节点 | `search({ key, conditionPath, productTag, resourceAddress })`；字段可省略，多个字段取交集 |
| 判断节点存在 | `has(query)`；复用 `search` 的查询语义 |
| 插入声明 | `insert({ before, conditionPath }, [key, content], { owner, identity, productTag, resourceAddress })` |
| 调整位置 | `move(node, { before: anchor })` 或 `move(node, { after: anchor })` |
| 撤销节点 | `remove(node)`；失去全部来源的产物随之撤销 |
| 只退出输出 | `remove(node, { from: 'output' })`；保留来源关系，不触发撤销清理 |
| 登记依赖 | `depend(product, { owner })`；显式指定依赖者，成为产物来源 |
| 注册撤销清理 | `onRemove(node, () => { ... })` |

`search` 按属性名匹配 Key、按规范化输出地址匹配条件路径；结果保持队列顺序，不改变来源。`nodes()` 是内部逃生舱，仅提供队列快照，常规查询使用 `search`。最近语义父定义和修改步骤的前后位置由 Variable 从候选节点中查询，不增加 Controller 专用入口。

插入的位置与 `[Key, content]` 声明分别传入；来源和查询标识放在第三个参数。`before` 与 `after` 互斥，锚点、条件路径和来源 `owner` 都必须显式传入。位置锚点与来源独立。每次插入紧邻指定锚点；连续向后生成并保持调用顺序时，以上次返回节点作为下次锚点，不维护隐藏的插入游标。`move` 把节点放到紧邻锚点的位置，不改变地址与来源。

节点的内容身份未变但编译前提改变时，递增 `node.compileRevision` 使旧编译及同址聚合结果失效。无法继续时写入 `node.deferredReason`，或使用快捷方法 `defer(node, message)`；每次尝试前清除旧原因，后续波只重试未完成的通知，不重调前序成功通知，也不撤回已执行的内容设定或队列操作。队列无进展时报告原因。`setContent` 仅在对应同步通知内有效，旧上下文不能继续操作位置记录。内容对象的 `compileWaveIndex` 指定最早编译波；当前波次由编译器内部掌握，不进入上下文或 Controller。激活只由编译器内部处理，引用环和超过上限的内容链会明确失败。

当前消费者用context.session作为私有WeakMap键，编译会话的身份与公开改写效果见[位置改写行为](doc/behaviors/内容改写只影响本次消费位置.md)。

## 内容链与变量实现

`Value` 包装 Content，默认把数组递归输出为逗号列表，也可用 `toCSSString` 改写输出，不改变 Variable 身份。`valueList` 与 `valueSequence` 分别装配默认逗号和空格列表；Value 的 `dependencies` 显露嵌套数组中的待编译内容对象。JSS 内容组织工具和 Atom Creator 构造的内容对象同样在 `dependencies` 中显露原操作数，让次波编译嵌套引用。每个声明角色按内容对象保存唯一位置记录，通知与 Controller 操作修改该记录；最终输出与同址聚合直接读取同一份记录，没有额外的返回值或结果副本。

`Variable.onCompile(context, ast)` 在普通消费时插入 `@property` 注册及 Variable 自身状态定义，再通过 `setContent` 设定可输出的 CSS `var()` Value。普通内容和状态配方中的来源 Variable 都保留 CSS 引用，由浏览器读取当前状态、局部覆盖和修改结果；配方状态不替来源选择内容。状态定义由 Variable 自己确定地址与插入顺序，不生成状态交集。自动状态定义按即将插入的目标地址查找最近的同一 Variable 局部声明，使用其基础值 Key；没有局部声明时使用 `config.definitionKey`。自动产物以 Variable 对象作为不透明 `productTag`，局部声明通过通用产物查询和语义父链清理归属自身的旧产物；`productTag` 只供查询，不改变节点来源所有权或资源替换。Compiler 不按 Variable 类型分支。多个独立目标由并列declare插入普通队列；具体Variable引用激活自身定义，纯Name只输出CSS引用。按需依赖沿同一编译和输出链处理。

## 当前输出组织

`JSSContentNode` 是编译完成的声明，保留输出地址、JSSKey、内容对象及子内容编译结果。其 `conditionPath` 已合并 target/state，描述最终 CSS 嵌套位置。同址同名至少两项在稳定队列中默认形成逗号数组 Value，或调用组内唯一显式 Key `join`；若结果带待编译内容，继续进入编译波。输出器读取最终队列内容对象的 `toCSSString`，打开和关闭条件块并返回 CSS 字符串，不再编译或聚合。

相关实现：[Rule](rule.ts)、[JSSKey](key.ts)、[JSSContent](content.ts)、[Value](value.ts)、[Variable](variable/core.ts)、[Rules 到样式节点](compiler/rules-to-style-nodes.ts)、[样式节点到内容节点及 ASTController](compiler/style-nodes-to-content-nodes/compilation.ts)、[内容节点到 CSS 字符串](compiler/content-nodes-to-css-string.ts) 与 [CSSRoot](css-root.ts)。正式入口覆盖见 [内容编译波测试](test/内容编译波遍历及插入节点.test.ts) 和 [样式登记与依赖测试](test/样式登记经依赖解析生成CSS.test.ts)。

`remove(node, { from: 'output' })` 只移除输出位置，保留其来源和产物；`remove(node)` 撤销节点，并删除失去全部来源的后继。待入队依赖只接受仍存活的来源，共享资源不会因一个消费者消失而被撤销。节点插入和移动统一由 ASTSession 执行。

Variable 的 declare/modify 内容和其他内容一样直接调用 onCompile；AST 只按通用字段查询队列；Variable 自行判断语义归属与修改步骤，不向 AST 增加领域查询。Compiler 不设专门的改写器阶段。

Variable 的注册配方使用 `resourceAddress` 查找同址资源、`productTag` 区分对象身份，并组合 `search`、`depend`、`remove`、`insert`。同一对象的活跃消费者复用现存产物；不同对象首次消费替换同址注册。旧对象在本次激活期内再次消费不会反过来覆盖新注册；其全部消费者撤销后可重新激活。该激活期由 Variable 自己保存，不由 Controller 管理。

## 状态与变量接入

当前快捷状态通过状态路径接入；直接条件随后使用配置书写次序。登记实现把主体附加条件包进:where()，以保留主体地址权重；已有:where()允许嵌套，不为消除包装引入选择器解析，At Rule保持原样。中央顺序及直接条件实际覆盖的公开结果由[状态行为](doc/behaviors/同时成立的状态必须有确定结果.md)负责，包装方式可以随核心调整。

当前Variable声明按同一具体对象和原语义路径选择基础，修改链按声明位置连接。选择门保存原地址的条件选择，阶段结果引用前序CSS内容；现有颜色实现用完整Modification内容，不按每个通道建立业务控制对象。每步结果的辅助变量组织是当前实现成本，不构成对外固定数量。晚到内容顺序、局部基础和继承结果见[相对修改](doc/behaviors/相对修改保留基础与操作顺序.md)。

操作入口通过FNKit的DataShape/matchShape读取自然材料，modify按type选择应用，adjust构造来源与变化的结果材料；校验和转译留在操作领域。协议的公开输入与拒绝边界见[声明材料](doc/behaviors/样式声明必须明确目标与内容.md)，不要求信息体知道操作实现。

当前同址聚合收集获选贡献的有序Value视图，保留输入Value时读取原位置已编译内容，改写content后由结果位置消费新内容。JSSContentNode输出只读已完成内容，不重新运行生产函数；位置视图与编译记录的共享方式是当前实现，join的外界扩展结果由[贡献组合](doc/behaviors/重复声明按约定组合贡献.md)负责。

## Button 接入

Button.style.ts拥有Button具体颜色、条件及公开控制点。基础纸色、墨色、品牌色等材料与普通转换留在Style System；组件不经全局中转角色取得自己的表面、内容和边线定义。lineColor(base)是普通函数，lineStrength是可全局/局部控制的Variable。

普通/危险语气通过同一rules中的并列declare分别选择buttonToneColor、buttonSoftColor、buttonStrongColor、buttonLineColor与buttonToneContentColor。原有浅底0.14、轮廓0.44和背景强度配方保留，plain/filled贡献继续用modify。Button表面、内容、来源、画布和强度均为具体对象，组件入口导出实际控制点。

clickable的focusColor接收组件的具体边线；轮廓构造函数据所选内容创建有自身focus状态的Variable。布局、禁用淡化、按压和焦点仍由通用效果承担，不建立共享颜色组。Button静态导入样式，应用在render前统一mount。

## 验证

同目录测试验证单文件契约，领域test/验证协作行为。单元测试覆盖对象隔离、Name纯引用、derive、默认/状态、编译波、资源、修改/调整、条件与失效清理；浏览器测试验证双基础转换与全局/局部强度、后代物化、状态组合、独立颜色声明及真实Button的普通/危险/hover/active/disabled/focus。
