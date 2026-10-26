# Style System 架构

本文件保留通用编译职责与运行链，内容模型按 Token 目标设计更新；Token 相关源码已完成迁移，公开入口已提供 Token。目标定义与坍缩规则以 [Token 设计](doc/Token设计.md) 为准。对象语义和组件样式书写方式见 [样式系统对象与行为.md](doc/样式系统对象与行为.md)，命名见 [样式系统命名.md](doc/样式系统命名.md)，可证伪的行为边界见 [__spec.md](doc/behaviors/__spec.md)。

## 从定义到浏览器

```text
Condition + Declaration(声明目标, Content) → Rules → CSSRoot
Rules → rules-to-style-nodes.ts → JSSStyleNode[]
JSSStyleNode[] → compiler/style-nodes-to-content-nodes/compilation.ts → JSSContentNode[]
JSSContentNode[] → content-nodes-to-css-string.ts → CSS string → 浏览器
```

Pieces 是可复用碎片的统称；Atom 表示可作为一块使用的 Token，不增加独立类型。Rules 将声明目标、内容和条件组合，通用编译器处理 AST 及 CSS 输出，不按原有两套内容对象分流。

Token 的参数归一为 default、name、state、address、registration、onFirstScan、compileWaveIndex 七项。内部 _kind 由系统确定，不是第八个公开配置。name、state、address、registration 或 modify 需要 CSS variable 身份，匿名时自动生成名称；其余直接输出 CSS value。

嵌套 Token 是普通可坍缩表达式。它进入定义或计算时自然引用输入的坍缩结果，不判定是否复制来源。需要组合定义时，普通函数读取相应字段并返回新 Token；不保留内置用途变体、独立定义调整操作、加工来源记录、附带声明列表或额外声明目标键。

onFirstScan 可以返回包含 modify 的规则。编译必须先读完会影响目标的修改，再坍缩该 Token；不规定激活波次，不把第一次访问等同于最终输出。compileWaveIndex 继续表达内容的最早处理时机。通用 AST 的引用访问、资源归属与撤销仍是编译处理，不另建持续监听机制。

state 的快捷条件和直接条件仍复用完整 ConditionPath。组件状态的地址由组件明确表达，跨地址仍遵循浏览器 CSS 层叠，不在每个消费位置重新展开来源公式。Token 不携带 priority，同址声明顺序交给声明系统。

计算工具按 [工具公约](pieces/contents/functions/SPEC.md) 组织输入与结果，CSSFunction 保留独立的 CSS 函数定义职责。颜色变化可以通过 oklch(source, changes) 组合内容，通道与格式转换不增加另一种内容实体。modify 表达使用端对同一 Token 的条件修改，普通函数表达新定义的产生。

compileCSS 只返回字符串；cssRoot.mount 保留宿主前缀，内容未变不重写，编译或提交失败保留此前成功结果。

## 文件职责

| 位置 | 职责 |
| --- | --- |
| condition.ts | Condition、完整 `conditionPath`、目标与状态子路径，以及 CSS 输出地址与地址身份 |
| pieces/state-conditions.ts | 主体状态名称、条件登记、中央顺序与状态路径追加 |
| key.ts | JSSKey 的创建、识别与别名解析 |
| custom-property-names.ts | Token 与 Modification 共用的 CSS 自定义属性名称分配与避让 |
| token/css.ts | CSS 名称、声明目标及编译准备操作；自动名称缓存不作为显式配置 |
| token/args-parser.ts | 创建参数归一为七个固定 key |
| operations/declare.ts | Declare 材料形状、declare 入口，Key 配对及自然材料声明 |
| rule.ts | 声明组合、Rules 登记与句柄 |
| content.ts | 广义 JSSContent、窄 Expression、子内容读取与表达式构造 |
| token/index.ts | Token 创建、参数与类型的公开入口 |
| token/core.ts | 统一定义、状态、引用和特殊输出协议 |
| token/compilation.ts | 各位置的 CSS 准备、实际消费者及输出类别确定；与对象生命周期分离 |
| token/declare.ts | 显式赋值基础、根据地状态发布、消费者改绑与精确撤销 |
| token/registration.ts | CSS @property 的按需注册、替换与消费者退出 |
| operations/modify.ts | Modify 双方协议、材料校验、领域应用策略与操作内容构造 |
| token/modify.ts | 执行已选应用、按需修改步骤、结果消费与撤销；引用公共声明 |
| modification.ts | Modification 的 type/detail 定义、内置颜色转译、独立声明与应用材料 |
| css-function.ts | CSSFunction 定义主体、按需完整定义与调用 Token |
| rule-registry.ts | 单一源规则账本与登记句柄，内部共享 |
| css-root.ts | 三步编译调用和宿主提交 |
| compiler/contracts.ts | 公开的节点、查询与内容访问协议；实现依赖这些声明 |
| compiler/rules-to-style-nodes.ts | 将 Rules 展开为有序 JSSStyleNode 队列 |
| compiler/style-nodes-to-content-nodes/compilation.ts | 组合三项编译账本，编排访问、资源发布、波末核验、聚合和输出 |
| compiler/style-nodes-to-content-nodes/node-compilation.ts | 受影响节点队列、角色进度、输入失效、单次内容链访问、完成判断及内容节点结果 |
| compiler/style-nodes-to-content-nodes/resource-compilation.ts | 内容激活、当前 Rules 身份关联、key/content实际消费合并、失效资源退出与同址完整提交 |
| compiler/style-nodes-to-content-nodes/join.ts | 同址贡献收集、回调前输入快照、位置内容视图、连接、历史撤销与最新输出选择 |
| compiler/ast-controller.ts | 节点变化与顺序事实、节点查询、实际内容记录与位置视图读取、声明编辑及撤销生命周期 |
| compiler/compiled-content.ts | Join 与状态配方读取的中性位置内容视图，不重新求值原内容 |
| compiler/content-nodes-to-css-string.ts | 惰性读取已编译内容，并按 JSSContentNode 队列顺序输出 CSS 字符串 |
| pieces/keys | 可复用的 JSSKey 定义；创建时由 key() 登记名称与别名 |
| pieces/conditions | 可复用的普通 Condition；条件协议由 condition.ts 定义 |
| pieces/contents/atoms | 按用途组织的现成 Token |
| pieces/contents/functions | 遵守内容工具公约的混色、计算和相对颜色等 Token 构造 |
| pieces/contents/functions/calc.ts | 保存操作数依赖，构造 CSS calc 算术 Token |
| pieces/contents/functions/oklch.ts | 普通与相对 OKLCH 表达式、通道配置及共享的源无关通道转译 |
| pieces/contents/functions/SPEC.md | JSS 内容组织工具公约与 Expression、规则及定义主体的边界 |
| pieces/contents/atom-creators | 按结构生成阴影、动画等内容 |
| pieces/roles | 供组件在自身选择器中赋值的共享角色 |
| pieces/mixins | 把完整效果转换成声明组合 |
| test | 验证 Style System 多文件协作与完整业务流程 |
| doc | 面向使用和设计阅读的对象契约 |

Token 的公开接口见 [API 参考](doc/样式系统API参考.md)。上表列出当前源码的实际职责；对象定义见 [Token 设计](doc/Token设计.md)。

## 内容扩展与位置记录

公开扩展的输入、返回、同步位置、等待和撤销结果见[内容扩展与AST编辑.md](doc/behaviors/内容扩展与AST编辑.md)。本节记录当前机制，不将节点字段、内部数量或算法固定为对外承诺。

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

每个 `JSSStyleNode` 的 Key 和 Content 都在其自身位置编译。Content 可以是字面值或 `JSSContent`；Token 在组合时统称 Atom，Atom 不增加对象类型。JSS 内容组织工具和 Atom Creator 也可构造作为一块使用的内容。通用对象生命周期读取 onFirstScan、onCompile(context, ast)、dependencies 和 toCSSString。Token 的每位置 CSS 声明与引用准备由独立的 CSS 边界接入，不借公开生命周期回调重复接线。`onCompile` 是返回 void 的生命周期通知，编译器不读取返回值；对象通过 Controller 插入后续节点或设定当前内容。未设定新内容的对象继续消费自身依赖及输出能力，没有输出能力则不输出当前声明。纯字符串、数字与已完成的对象链直接结束该位置。只有链上所有对象都已编译或无需编译后，节点才成为 `JSSContentNode`。

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

当前Controller把这些操作交给同一编译会话；公开参数及可观察效果由[内容扩展与AST编辑.md](doc/behaviors/内容扩展与AST编辑.md)负责：

| 目的 | 调用 |
| --- | --- |
| 设定当前内容 | `setContent(context, content)`；只改写本次通知的内容位置，不覆盖外层声明或其他消费位置；显式 undefined 使此处不输出 |
| 查询有序节点 | `search({ key, conditionPath, productTag, resourceAddress })`；字段可省略，多个字段取交集 |
| 判断节点存在 | `has(query)`；复用 `search` 的查询语义 |
| 选择指定地址的声明 | `findDeclaration(query, accept)`；在可接受候选中选择有效项 |
| 查询实际消费 | `usesContent(node, input)`；读取当前key/content实际访问，不把历史替代记录当存活消费 |
| 插入声明 | `insert({ before, conditionPath }, [key, content], { owner, identity, productTag, resourceAddress })` |
| 调整位置 | `move(node, { before: anchor })` 或 `move(node, { after: anchor })` |
| 撤销节点 | `remove(node)`；失去全部来源的产物随之撤销 |
| 只退出输出 | `remove(node, { from: 'output' })`；保留来源关系，不触发撤销清理 |
| 登记依赖 | `depend(product, { owner })`；显式指定依赖者，成为产物来源 |
| 解除单个依赖 | `release(product, { owner })`；只退出该来源，共享产物保留到最后来源退出 |
| 注册撤销清理 | `onRemove(node, () => { ... })` |

`search` 按属性名匹配 Key、按规范化输出地址匹配条件路径；结果保持队列顺序，不改变来源。`nodes()` 是内部逃生舱，仅提供队列快照，常规查询使用 `search`。findDeclaration在指定地址按有效优先关系选择声明，可通过谓词排除加工产物。Token按指定根据地取得声明；修改步骤由Token组织。

插入的位置与 `[Key, content]` 声明分别传入；来源和查询标识放在第三个参数。`before` 与 `after` 互斥，锚点、条件路径和来源 `owner` 都必须显式传入。位置锚点与来源独立。每次插入紧邻指定锚点；连续向后生成并保持调用顺序时，以上次返回节点作为下次锚点，不维护隐藏的插入游标。`move` 把节点放到紧邻锚点的位置，不改变地址与来源。

节点的内容身份未变但编译前提改变时，递增 `node.compileRevision` 使旧编译及同址聚合结果失效。无法继续时写入 `node.deferredReason`，或使用快捷方法 `defer(node, message)`；每次尝试前清除旧原因，后续波继续推进未完成的内容，不重复调用已经执行的对象生命周期，也不撤回已执行的内容设定或队列操作。队列无进展时报告原因。`setContent` 仅在对应同步通知内有效，旧上下文不能继续操作位置记录。内容对象的 `compileWaveIndex` 指定最早编译波；当前波次由编译器内部掌握，不进入上下文或 Controller。激活只由编译器内部处理，引用环和超过上限的内容链会明确失败。

当前消费者用context.session作为私有WeakMap键，编译会话的身份与公开改写效果见[内容扩展与AST编辑.md](doc/behaviors/内容扩展与AST编辑.md)。

## 内容链与 Token 坍缩

`Token` 包装 Content，默认把数组递归输出为逗号列表，也可用 `toCSSString` 改写输出，不改变 Token 身份。`valueList` 与 `valueSequence` 分别装配默认逗号和空格列表；Token 的 `dependencies` 显露嵌套数组中的待编译内容对象。JSS 内容组织工具和 Atom Creator 构造的内容对象同样在 `dependencies` 中显露原操作数，让次波编译嵌套引用。每个声明角色按内容对象保存唯一位置记录，通知与 Controller 操作修改该记录；最终输出与同址聚合直接读取同一份记录，没有额外的返回值或结果副本。

需要 CSS variable 身份的 Token 在坍缩路径中通过指定地址查询保障根据地声明，生成 CSS var() 引用；普通 Token 直接输出 CSS value。onCompile 仅提供对象生命周期的 AST 操作机会，不要求所有 Token 都建立声明。token/declare.ts 建立显式基础与根据地状态产物，保留消费者关系，modify 以这些事实连接步骤与发布结果，不做局部输入观察或任意依赖投影。多个独立控制点需要换值时用并列 declare(target, newToken)。

## 当前输出组织

`JSSContentNode` 是编译完成的声明，保留输出地址、JSSKey、内容对象及子内容编译结果。其 `conditionPath` 已合并 target/state，描述最终 CSS 嵌套位置。同址同名至少两项在稳定队列中默认形成逗号组合内容，或调用组内唯一显式 Key `join`；若结果带待编译内容，继续进入编译波。输出器读取最终队列内容对象的 `toCSSString`，打开和关闭条件块并返回 CSS 字符串，不再编译或聚合。

相关实现：[Rule](rule.ts)、[JSSKey](key.ts)、[JSSContent](content.ts)、[Token](token/core.ts)、[Rules 到样式节点](compiler/rules-to-style-nodes.ts)、[样式节点到内容节点](compiler/style-nodes-to-content-nodes/compilation.ts)、[CSS 输出](compiler/content-nodes-to-css-string.ts) 与 [CSSRoot](css-root.ts)。正式入口覆盖见 [内容编译波测试](test/内容编译波遍历及插入节点.test.ts) 和 [样式登记与依赖测试](test/样式登记经依赖解析生成CSS.test.ts)。

`remove(node, { from: 'output' })` 只移除输出位置，保留其来源和产物；`remove(node)` 撤销节点，并删除失去全部来源的后继。待入队依赖只接受仍存活的来源，共享资源不会因一个消费者消失而被撤销。节点插入和移动统一由 ASTSession 执行。

Token 的声明与修改由编译准备过程调用 prepareCSSDeclaration 和 cssPreparation 接线，不占用公开 onCompile 生命周期的调用次数。AST 只按通用字段查询队列，CSS 边界负责语义归属与修改步骤，不向 AST 增加领域查询。

内容编译按角色保存实际访问，输入或地址签名改变后重访。ResourceCompilation只对失效onFirstScan资源解除来源；暂缓角色完成前保留已取得资源，不按revision清空普通产物。Token的根据地绑定及注册消费者复用usesContent/release清理，不建立另一套内容引用图。

Token 的注册配方使用 `resourceAddress` 查找同址资源、`productTag` 区分对象身份，并组合 `search`、`depend`、`remove`、`insert`。同一对象的活跃消费者复用现存产物；不同对象首次消费替换同址注册。旧对象在本次激活期内再次消费不会反过来覆盖新注册；其全部消费者撤销后可重新激活。该激活期由 Token 自己保存，不由 Controller 管理。

## 状态与变量接入

当前快捷状态通过状态路径接入；直接条件随后使用配置书写次序。登记实现把主体附加条件包进:where()，以保留主体地址权重；已有:where()允许嵌套，不为消除包装引入选择器解析，At Rule保持原样。中央顺序及直接条件实际覆盖的公开结果由[states与条件选择.md](doc/behaviors/states与条件选择.md)负责，包装方式可以随核心调整。

Token 在指定根据地选择有效基础，修改链按声明位置连接。选择门保存原地址的条件选择，阶段结果引用前序CSS内容；现有颜色实现用完整Modification内容，不按每个通道建立业务控制对象。每步结果的辅助变量组织是当前实现成本，不构成对外固定数量。晚到内容顺序、局部基础和继承结果见[Token 的定义组合与 modify](doc/behaviors/Token的定义组合与modify.md)。

操作入口通过FNKit的DataShape/matchShape读取自然材料，modify按变化材料的领域选择应用；定义组合由普通函数完成。校验和转译留在操作领域。协议的公开输入与拒绝边界见[rule与rules的登记和撤销.md](doc/behaviors/rule与rules的登记和撤销.md)，不要求信息体知道操作实现。

当前同址聚合收集获选贡献的有序内容视图，保留输入内容时读取原位置已编译内容，改写content后由结果位置消费新内容。JSSContentNode输出只读已完成内容，不重新运行生产函数；位置视图与编译记录的共享方式是当前实现，join的外界扩展结果由[rule与rules的登记和撤销.md](doc/behaviors/rule与rules的登记和撤销.md)负责。

## Button 接入

Button.style.ts 拥有 Button 具体颜色、分类条件及公开控制点。共享基础材料和普通转换函数留在 Style System；组件选择来源、地址及自身差异。表面、内容、边线等用途通过普通函数与具体 Token 表达，不放进 Token 的内置用途成员表。

组件分类仍通过 appearance、tone、size、status 等协议表达；组件的 Variant Props 不等于 Token 内置变体。布局、禁用反馈、按压和焦点由通用效果解释，视觉策略仍由组件选择。Button 静态导入样式，应用在渲染前统一 mount。

## 验证

本轮验证覆盖 parser 归一、直接值输出、嵌套引用、状态地址、自动命名、注册、onFirstScan 晚到修改及操作撤销。应覆盖引用出现在 modify 前后的相同身份，以及激活多波后才出现的修改，不以固定波数验证完成。

现有规则登记、内容扩展、资源共享、提交失败保护及浏览器层叠的独立行为继续保留。组件验证覆盖分类与状态交集及局部主题覆盖，不能以文档更名当作代码迁移或浏览器验证已经完成。
