历史记录：本文涉及旧基础绑定、组包装及按名关联的部分已由[2026-10-18修正计划](20261018_变量规则函数化与整组换色.md)替代；现役用法见[Variable](../../src/style-system/doc/变量定义与消费.md)。其余历史推导保留，不作为新接口契约。

# VariableName 与引用激活统一 Plan

状态：已实施并完成验收。日期：2026-10-17。用户先授权需求测试，随后授权按本 Plan 完成实现。

## 修改目标与依据

将 Variable 中隐含的引用身份明确为独立的 VariableName。Variable 注册时即绑定 Name；表达式可以提前引用 Name，具体 Variable 定义可以随后提供。引用 Variable 与引用其 Name，在值消费、依赖激活和 CSS 输出上效果相同。

本 Plan 承接本次用户确认，并补充 [Variable 依赖链与弱声明 Plan](20261015_变量依赖链与弱声明.md) 的名称与引用身份。旧 Plan 中同名声明、priority、顺序、状态和局部联动要求继续适用；字符串 name、动态改名和仅通过具体 Variable 对象引用的相关描述由本次语义接管。稳定对象契约以现役架构和变量消费文档为准。

实施前代码的修改依据：

- `variable/core.ts` 将 `name` 保存为可修改字符串，同时承担定义和引用消费。
- `variable/dependency.ts` 的联动按 CSS 名称索引，但消费和配方收集仍从 Variable 对象进入。
- `variable/args-parser.ts` 归一字符串名称、状态简写和 extend；Cluster、颜色构造及测试多处将 `.name` 当字符串使用。

这次应重划上述职责并替换旧路径，使名称引用成为共同机制；不在旧对象引用链之外另建一套 Name 激活链。

## 已确认语义与验收约束

### Name 可以独立创建，绑定发生在 Variable 注册时

目标 API：

```ts
const surfaceName = variableName('surface-color')

// 先保存对 Name 的依赖，不要求此时已创建对应 Variable。
const lineColor = variable(
  colorMix([surfaceName, 0.18], 'transparent'),
  'line-color',
)

const surfaceColor = variable('white', { name: surfaceName })
surfaceColor.name === surfaceName // true
```

快捷定义等价于同时创建 Name 并绑定：

```ts
const surfaceColor = variable('white', { name: 'surface-color' })
const surfaceName = surfaceColor.name

// 现有第二参数字符串简写继续成立。
const contentColor = variable('black', 'content-color')
```

`Variable.name` 返回 VariableName，不再返回字符串。Variable 注册后不动态注入、替换或重命名其 Name；需要另一个名字时创建相应定义，不保留旧改名 setter 或双轨 name 字段。

Name 表达引用身份，Variable 保存默认内容、状态、registration、onActive 等定义材料。Name 不复制另一份定义配置，也不把来源提前求成 JS 色值。

同一规范化 CSS 名称指向同一名称身份；不能用两个 Name 包装对象是否为同一 JS 对象隔断同名依赖。不要求为满足这一点额外引入对象驻留机制。

### Variable 与 Name 共用值引用和激活机制

```ts
colorMix([surfaceColor, 0.18], 'transparent')
colorMix([surfaceColor.name, 0.18], 'transparent')
```

两种写法在同一编译输入和消费位置下，必须得到相同的名称依赖、默认声明、状态、资源与 CSS 引用结果。直接引用 Variable 是引用其 Name 的快捷方式，不享有绕开同名规则的特殊优先权。

引用 Name 时，按名称找到对应定义材料，继续处理其结构化依赖及所需资源。创建 Name、注册 Variable、保存派生配方本身不输出 CSS，也不执行默认内容生产函数。默认值不会被写成 `var()` 的第二参数。

继续区分真实 CSS 属性消费与 Active 资源生命周期：仅有独立声明、Active 资源或资源描述符不因此激活原生属性的依赖联动；动画帧中的原生属性消费继续按现有规则处理。Name 引用不能重复执行或漏掉原有资源生命周期。

### JSS 身份与 CSS 产物分开

JSS Variable 和 Name 在创建时即成立，CSS 声明与引用在编译消费时产生。Name 已存在、Variable 已注册，不等于 CSS 中已经生成声明。

值位置的 Variable 与 Name 都编译为 `var(--surface-color)`；声明键位置仍为 `--surface-color`。明确区分两种输出角色，不以隐式字符串转换混用地址和引用。

本次不增加基于引用次数的内联优化，也不把“所有 JSS Variable 必须立即生成 CSS Variable”作为前提。

### 同名定义完全沿用现有 priority 和顺序规则

用户最新裁决：同名定义沿用现有 priority 和顺序，不再建立另一套选择规则。该问题已决，不作为未决项重新提出。

- Name 注册保存定义关系，不提前按“最后注册对象”淘汰其他同名定义，不增加首注册优先、唯一默认定义或重复名称拒绝规则。
- 同 CSS 名称、同完整条件地址的候选继续进入现有声明选择：高 priority 优先，同 priority 按现有书写顺序；覆盖型 Variable 保留最后有效值，普通 Key 保留既有 join／聚合。
- priority 继续属于定义／声明键，Name 不拥有统一 priority，不能将同名材料的等级合并成一个值。
- 保持当前创建规则：`specifiedPriority ?? (extend ? extend.priority + 1 : 0)`，显式 0 有效；联动声明使用配方 priority 减 1，该次 states 与该声明同级；普通 Key 默认 999。
- 默认补全、同名状态借用及联动产生的候选也进入原有选择链。注册关系不得再加一层覆盖顺序，不得通过注册表覆盖或无序遍历改变既有结果。
- 不同完整条件地址之间继续由 CSS 原生作用域和层叠处理，不把某一地址的胜出定义提升成全局唯一来源。

### 保留声明与修改的真实归属

值引用等效，不等于 Name 自动获得完整 Variable 的所有操作能力。本次不新增 `modify(name, ...)` 或无内容的 `declare(name)` 的定义推断。

Variable 的局部声明继续持有自身基础值与状态；Modify 继续按最近同对象声明确定修改归属。同名引用连接不能把另一个同名对象变成修改基础。

子作用域覆盖来源后，派生关系继续在需要的位置重新声明，避免只继承祖先已求值的 CSS 自定义属性。沿用现有 AST 产物归属、重访、撤销与跨编译隔离，不增加浏览器运行时观察器。

## 文件落点与职责调整

以下为实施范围。开始实施时先核对完整文件及文件开头职责注释；内部调用可为职责收口调整，但不能借此改变以上运行语义。

| 文件或区域                                                         | 当前职责与修改理由                                      | 计划修改                                                                                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 新增 `src/style-system/variable/name.ts`                           | Name 是 Variable 领域的引用身份，不属于通用编译器       | 提供 `VariableName`、`variableName()`；管理名称规范化、定义绑定与查找接入，接入统一引用消费；内部识别和登记函数只按实际调用需要设置，不扩成公开注册框架            |
| `src/style-system/variable/args-parser.ts`                         | 已有创建参数归一边界                                    | 接受 `string \| VariableName`；字符串快捷写法归一为 Name，已提供的 Name 保持原身份；extend 沿用来源 Name，保留默认内容、原始状态与现有 priority 规则               |
| `src/style-system/variable/core.ts`                                | 保存定义并投影声明与引用材料                            | 将 `Variable.name` 改为 VariableName；创建完成时绑定定义，移除动态字符串改名；普通值引用归一到 Name，保留定义侧配置、共同声明及资源能力，移出重复引用逻辑          |
| `src/style-system/variable/dependency.ts`                          | 已有实际消费、默认请求和名称联动协调                    | 将 Variable／Name 输入统一为名称依赖；按 Name 取得定义材料；改造 `observeVariable()`、`referencedVariables()` 对应职责，保留一套消费、联动、产物撤销与稳定核验账本 |
| `src/style-system/variable/declare.ts`                             | 已有公共声明基础、状态及归属                            | 从 Name 取得名称，保留具体声明对象；默认、显式、Key 和原始二元声明继续共享基础与状态发布，候选沿原 priority／顺序／join 选择                                       |
| `src/style-system/variable/modify.ts`                              | 已有相对修改步骤及撤销                                  | 适配 Name 取得和引用生成，保留最近同对象声明归属、步骤选择及 AST 生命周期，不改成按名字跨对象修改                                                                  |
| `src/style-system/operations/declare.ts`、`modify.ts`、`adjust.ts` | 输入协议、材料构造与领域应用入口                        | 核对新名称类型和引用材料；复用统一引用链，保留天然 key/content 材料契约及 Adjust 共同声明，不增加 Name 专属操作分支                                                |
| `src/style-system/key.ts`                                          | 通用声明键、名称分配、priority 与 join                  | 继续复用 `allocateVariableName()` 和同一 CSS 名称空间；不把 Variable 定义注册搬进 Key，不另建名称生成器，清理不再需要的 Variable 字符串适配                        |
| `src/style-system/variable-cluster.ts`                             | 成员选择、default 代理、同名配对及继承                  | 适配 `.name` 类型、同名比较和冲突信息；`clusterFrom` 沿新 Name 契约创建成员；Cluster 仍聚合 Variable，不新增自动把 default 注入派生成员的约定                      |
| `src/style-system/modification.ts`                                 | 独立变化材料，当前使用公共 Variable 消费入口            | 核对公共入口改造后的引用、资源和 Adjust／Modify 接入；仅修改受影响部分，不顺带将整个 Modification 公共 name API 改为新对象模型                                     |
| `src/style-system/pieces/tokens/color/` 及其他名称消费处   | 颜色定义与用途派生，存在由 `base.name` 拼接成员名的调用 | 迁移 `.name` 字符串假设、名称派生及比较；允许颜色表达式直接引用 Name。保留现有颜色来源、混色系数、状态与显示结果，不借此将 lineColor 换成另一套用途设计            |
| `src/style-system/variable/index.ts`、`src/style-system/index.ts`  | 领域及样式系统出口                                      | 汇总 `variableName` 与 `VariableName`；内部账本、注册和查找不公开。领域内部直接引用定义文件，不把出口当逻辑中转                                                    |
| 现有测试、调用处、文档和构建产物                                   | 对外类型变化需要同步接管                                | 全仓迁移 `.name` 拼接、比较、改名及类型断言；实施完成后更新架构与消费文档、构建 dist，删除旧字符串改名语义和残留路径                                               |

公开新增函数限于 `variableName()`，公开新增主体类型为 `VariableName`。内部需具备“识别 Name、绑定定义、查找定义、统一引用消费”的能力，函数名与拆分数量由实际责任决定；不预设额外 Controller、Manager、注入容器、通用 registry 或兼容包装。

## 实施顺序

1. **固定行为与类型验证。** 在现有 Variable 测试及依赖流程测试中增加 Name 前置引用、引用等效和同名选择场景，先取得旧实现不支持目标行为的失败证据。改写依赖动态改名的旧用例，使其验证创建时绑定；保留它们原本验证的名称避让与声明独立性。
2. **完成 Name 与定义绑定。** 新增 Name 主体，调整参数归一及 Variable 创建。检查快捷写法、显式 Name 和 extend，避免保留字符串／对象两套内部事实。
3. **收口引用、激活与声明。** 改造原有 Variable 消费及依赖协调，Variable／Name 从同一入口处理；默认、状态、onActive、registration、共同声明与局部修改归属一并验证。同名候选直接接入现有选择，不追加选择器。
4. **迁移消费者并删除旧机制。** 同步操作、Cluster、Modification 接入和颜色定义；扫描全仓 `.name` 字符串假设、动态改名、旧引用辅助逻辑及重复账本。每处新增转换都检查是否应由 Name 边界统一负责。
5. **验证并更新现役说明。** 行为验证通过后，更新 `src/style-system/architecture.md`、`src/style-system/doc/变量定义与消费.md` 及实际受影响的 API 示例，构建产物同步。最后按领域说明职责迁移和删除的旧路径，不用测试通过替代结构检查。

实施过程中发现文件职责不能用一段话讲清时，先修正本 Plan 的落点，再继续实现，不在错位位置补分支。实现授权和运行授权依后续用户指令取得，本 Plan 不自动启动实施。

## 验证与完成条件

| 验证对象           | 应证明的行为或实际失败方式                                                                                                | 验证位置                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Name 创建与绑定    | 独立 Name、快捷定义和 `.name` 获取一致；禁止后期替换绑定；同名不同包装不隔断依赖                                          | Name 多文件连接行为集中于 `test/变量依赖与声明行为.test.ts`，调整 `variable/core.test.ts` 与 `variable/args-parser.test.ts` 的公共契约断言 |
| 前置引用与等效消费 | Name 先引用、Variable 后注册，在注册完成后编译；Variable／Name 直接及嵌套消费的声明、状态、资源相同，且没有重复资源       | 扩充 `test/变量依赖与声明行为.test.ts` 等现有流程测试；比较编译 AST／CSS，不断言私有 Map 或回调次数                                        |
| 同名定义选择       | 不同 priority、同级不同书写顺序、同名不同对象／Name 包装、extend 和完整条件地址均保持旧规则；不能被注册顺序的额外规则覆盖 | 扩充现有同名声明流程场景，明确有效值及普通 Key.join 的结果                                                                                 |
| 激活与生命周期     | 仅创建／注册不输出 CSS；真实消费与资源生命周期仍分开；移除或改写消费后撤销旧产物，重复编译互不污染                        | 复用并扩充依赖、挂载及资源流程测试                                                                                                         |
| 局部覆盖与操作     | 子作用域覆盖来源后派生值更新；Name／Variable 消费效果一致；同名不同对象不串接 Modify 基础；Adjust 保留共同声明及资源      | `test/变量依赖与声明行为.browser.test.ts`、既有修改／调整流程和 Button 浏览器用例，验证静态 CSS 的实际结果                                 |
| 调用迁移与完整性   | 没有残留动态改名、将 `.name` 当字符串的调用或两套引用／激活机制；旧类型与实现已退出，公共出口及文档一致                   | 全仓引用扫描、类型检查、差异审查和构建产物核对                                                                                             |

后续实施验收执行 `bun run test:unit`、`bun run test:browser`、`bun run type-check`、`bun run build` 与 `git diff --check`。测试按具体行为补足，不为每个内部函数机械增加用例。通过测试后仍需核对定义、引用、激活和声明的责任链是否唯一，新增机制是否具有实际用途。

## 保留边界与待明确事项

同名定义的选择已按用户裁决固定，本 Plan 不再保留第二套默认来源策略。

尚未确认的内容不作为本次实施前提：

- 只有 Name、尚无 JSS 定义且没有可用声明时，是否需要额外诊断；不自行新增报错、默认值或运行时等待机制。
- 最初讨论的无 Name 派生 Variable、`base => ...` 注入、通用派生规则复用和 CSS 表达式内联策略；本轮没有将其确定为 API，不通过自动临时命名或 Cluster 默认注入替代后续讨论。

正式实施前重新检查工作区；保留用户已有修改，不执行 Git 回退。任务临时文件统一放在 `agents/run/`，实施结束或中断时仅清理本任务不再需要的临时产物。Plan、源码和需求测试作为正式产物保留。

## 实施落点与调整

Variable 领域定位保持：`name.ts` 保存名称身份和同名定义关系，`args-parser.ts` 提前归一名称输入，`core.ts` 注册固定绑定并投影唯一的定义消费材料。值消费统一经过 Name；声明键保留具体定义，避免把同对象 Modify 归属改成按名称查找。Name 不复制 default、states 或 priority，也不预选胜出对象。

`dependency.ts` 继续拥有真实消费、默认需求与当地联动；结构化引用同时识别 Name。`declare.ts` 保留唯一的状态发布，独立显式材料的状态不借另一同址 Key 提升等级。同名同完整地址已有显式基础时，自动当地投影不再重复发布；真实消费资格及观察关系不因此退出，跨地址联动仍保留。

Cluster 仍聚合 Variable，其同名检测和派生成员命名改从声明地址取得；颜色用途配方、来源和混色系数保持。操作入口、Modify 步骤与天然材料协议沿用原链，没有新增 Name 专属操作、Controller 或注册框架。

需求测试阶段已取得 26 项单元及 4 项浏览器 RED。实施中修正前置 Name 测试的 CSS 规范化空格预期，并为独立参数用例隔离 CSS 名称，保留全部行为断言。原 Variable 同名资源重启测试的对象退出前提已被共同 Name 语义接管：天然材料继续验证完整退出后重新注册；Variable 则验证共同 Name 还有消费者时不会按对象重启。两种资源契约均有反证，未经修改实现绕过。

首轮实施验收：单元测试 403 项、完整浏览器测试 175 项全部通过；最后颜色成员命名整理后定向复验颜色与 Button 浏览器 38 项通过。类型检查、正式 build、构建产物 Name 引用烟测及 `git diff --check` 通过。约束、复用、独立行为审查和精简复查均通过；现役契约已同步至 [__spec.md](../../src/style-system/doc/behaviors/__spec.md) 和 [Style System 架构](../../src/style-system/architecture.md)。构建后的 dist 已实际更新，沿仓库现有规则忽略，不改变跟踪配置。

本阶段遗留的失败截图共 34 张已按实施前清单逐个识别、移入任务目录后清理；此前已有 44 张截图哈希保持一致。临时构建烟测脚本已清理，需求测试、Plan 和正式源码保留，运行日志及实施报告保存在 `agents/run/variable-name-implementation/`。

## 职责收拢与反例补验

用户授权从首轮审查结论重整职责，先补测试并取得 RED，再调整实现。本阶段不新增公开 API。

- **时机等效反例**：同一 Variable 的定义内容为第 2 波，onActive 读取闭包；第 1 波其他内容改变闭包。普通 JSSContent 作为参照，Variable 与 Name 必须具有相同资源结果，默认生产函数仍在第 2 波取新值。原实现 Variable 本体和定义材料重复持有波次，资源分别得到 blue/red，反例成立。
- **纯 Name 来源反例**：没有对应 JSS Variable，父子 CSS Key／原始二元声明提供 red/blue。原图将 Name 展开成 Variable[] 后再取地址，零定义时丢失依赖，Child 缺当地线条声明；真实浏览器继承红色派生，未使用蓝色来源。两种声明入口均已取得 CSS 与浏览器 RED。

时机只留在定义材料，保留普通 onActive 先访问、onCompile 再按波次运行的契约。`consumeVariableDefinition` 只处理定义副作用及结构化依赖；Name 负责唯一具名值引用。天然材料仍由原引用入口输出一次引用；已有 Variable 在 referenceVariable 处直接沿用自身内容协议，声明键与 Cluster 行为由完整回归验证。旧 createVariableReference 已退出。

依赖图直接从 Name 地址收集边；旧 variableNameDefinitions 与 Variable[]→地址转换退出。Name 只关联定义材料，注册关系简化为地址到材料集合，不再保留已无查询用途的 Variable 键及反向类型依赖。原 priority／顺序、Modify 同对象归属和 AST／资源账本保留。

职责收拢验收：两反例先取得单元 3 项及浏览器 2 项 RED，再实现；最终单元 406 项、浏览器 177 项全部通过，类型检查、正式 build、实际 dist 两反例烟测及 `git diff --check` 通过。独立行为、约束及精简复查均通过。原暂存差异指纹保持一致，本阶段只追加工作区变更；新产生的 2 张失败截图和一次性烟测脚本已精确清理，既有 50 张截图哈希不变。复核证据位于 `agents/run/variable-name-responsibility/`。
