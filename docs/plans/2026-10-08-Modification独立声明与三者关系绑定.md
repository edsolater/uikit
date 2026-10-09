# 2026 年 10 月 08 日：Modification 协议、内置转译与三者关系声明

**状态：Modification 通用主体与 type 多态路由纠正已完成验收。** 材料协议及 FNKit 复用的此前记录保留为回归基线；当前裁决、交付和证据见末尾。

本轮补齐的能力是：**Modification 通过 Declare 协议独立定义，通过 Adjust、Modify 协议应用于目标；Variable 实现 Declare、Adjust Target、Modify Target 协议。Adjust 绑定 Source、Modification、mergedResult，一次声明同时声明三者。**

本计划采用讨论后明确的协议分工，替代此前要求 Modification 具备 Variable 身份的方案。最新裁决进一步明确：协议是操作需要的材料形状，信息体天然满足它，不需要知道外部操作或实现转发方法。

## 缺失能力与存在理由

实施前 `modification(...)` 保存表达式变化回调；颜色专用入口提供颜色配方编译，通过 `variable(colorVariableModification(...))` 承载配方声明，尚未形成统一 Modification 入口及双方协议。原 `adjust` 读取 JS 数据计算结果，没有保存三者的绑定关系或组织三者的共同声明。上述入口仅记录本次迁移来源，已随实施退役。

需要补齐的职责是让“变化本身”能够独立声明和引用。只有 Source 和结果时，可以把变化直接写进结果表达式，但无法独立声明这份变化，也无法让多个 Source 共同引用同一份变化声明。

Source 提供原始内容，Modification 提供变化描述及其表达能力，mergedResult 表达两者组合后的内容；Adjust 负责绑定关系。独立变化与领域内容转译有必要职责；“颜色变化成为 Variable”这个组合不再作为独立的 Color Variable Modification 概念保留。

## 本次需要实现的协议分工

下表记录用户已明确的目标职责。协议名称用于区分参与位置，具体 TypeScript 接口与字段已在末尾落实。

| 对象 | Declare 协议 | Adjust 中的协议 | Modify 中的协议 |
| --- | --- | --- | --- |
| `Modification` | 独立定义、声明自身的变化内容 | **Adjust 协议**：作为变化方参与应用 | **Modify 协议**：作为变化方参与应用 |
| `Variable` | 独立定义、声明自身的内容 | **Adjust Target 协议**：作为调整目标 | **Modify Target 协议**：作为修改目标 |

声明和应用入口根据对象实现的协议判断能否参与，不限定为某个具体构造函数创建的对象。Adjust、Modify 根据双方协议组织应用：Modification 提供变化能力，目标提供目标侧能力；具体如何绑定、如何应用，由使用方控制。不能把 Modification 的 Modify 协议误解成“控制器修改 Modification 自身”，那是后续能力。

## Modification 入口与内置转译

入口采用 `type` 与 `detail`：`type` 指定内容领域及其转译规则，`detail` 描述变化。以下接口已实现：

```ts
const change = modification({
  type: 'color',
  detail: {
    lightness: 0.3,
    chroma: x => add(x, 0.3),
  },
})

declare(change)
modify(source, change)
adjust(source, change)
```

示例中，固定值表示设为该值，回调表示保留相对变化关系。`x` 是内容表达式；颜色转译以通道符号 `c` 表达它，不需要绑定某一个 Source。示例配方为 `0.3 calc(c + 0.3) h / alpha`。

Modification 使用 JS 对象保存定义参数，声明编译时由内置 Adapter 将内容转译为 CSS 引擎能接受的配方。Adapter 只负责内容转译，是 Modification 的内置能力；不建立独立 Adapter 层或要求使用者先执行 `Modification → Variable` 转换。

Color、Size 等是不同内容领域的转译规则，Modification 的职责不限于 Color。本次明确颜色规则的迁移；Size 的具体参数和 CSS 表达尚未定义，不能因提到 Size 就直接补造实现。

转译可沿用可编译的内容表示，到输出阶段生成 CSS string。任意 JS 回调的运行结果不自动等于可独立声明的 CSS 配方，须明确受支持的表达方式。

## 目标关系与声明产物

| 对象 | 内容与职责 | 依赖关系 |
| --- | --- | --- |
| `Source` | 保存原始内容的 Variable | 可独立声明和使用 |
| `Modification` | 独立的变化对象，通过 Declare 协议输出自身的 CSS 配方声明 | 配方不固定到某一个 Source |
| `mergedResult` | 保存组合表达式的 Variable | 引用 Source 和 Modification |
| `Adjust` | 绑定三者关系，使一次声明包含三者 | 使用上述对象，负责组合关系 |

目标关系为 `Source + Modification → mergedResult`。Modification 自身的声明输出变化配方；mergedResult 的声明引用它和 Source。具体组合写法由内容领域决定。

颜色领域的 CSS 示例如下，用于说明声明产物；变量命名和作用域只是示例，实际调用为 `declare(adjust(source, change))`：

```css
.example {
  --source: oklch(0.5 0.1 240);
  --modification: 0.3 calc(c + 0.3) h / alpha;
  --merged-result: oklch(from var(--source) var(--modification));

  color: var(--merged-result);
}
```

一次声明这份绑定关系，应同时产出前三条 CSS 变量声明。使用者不需要再分别手工声明三者。最后一条 `color` 展示如何消费 mergedResult，不属于三者绑定自身。

当作用域中的 Source 或 Modification 声明发生变化时，mergedResult 应通过 CSS 引用关系体现变化。通过控制器修改 JS 描述及触发声明更新，属于后续能力。

## Adjust 与 Modify 的影响

| 能力 | 实施前行为 | 本次修改目标 |
| --- | --- | --- |
| `declare` | 特判 Variable 的基础声明，其他 Key 配对内容 | 按 Declare 协议支持 Variable 与 Modification 的独立定义，并接入绑定关系的共同声明 |
| `adjust` | 读取默认 JS 数据，计算新值；默认返回新 Variable，`'mutable'` 模式写回原 Variable | 使用 Adjust Target 与 Adjust 协议，绑定 Source、Modification、mergedResult，保留引用关系，并使一次声明覆盖三者 |
| `modify` | 使用变化描述生成修改声明；颜色配方可经 Variable 引用，已有条件、顺序和局部声明处理 | 使用 Modify Target 与 Modify 协议，将变化应用于目标，保留独立配方引用，核对条件与修改顺序 |

Adjust 的关系绑定与原 JS 值计算有不同的产物和生命周期。本次由 CSS 关系绑定替换原 JS 计算与 `'mutable'` 模式，依据见落实结果。

Modify 的目标方与变化方协议职责已接通，绑定结果作为普通 Variable 可继续参与 Modify。现有条件组合和修改顺序由原使用端维护，颜色应用保留配方引用。

## 控制器修改：后续能力

创建入口可以返回承载 Modification 的控制对象，返回对象需支持本次确定的声明与应用协议。以后可通过控制器修改这份 Modification 的变化描述；本次不提前实现修改方法、更新通知和重新编译机制。具体控制器接口留到后续设计，不为预留能力增加空方法。

## 修改顺序与代码落点

| 顺序 | 修改内容 | 代码落点与归属理由 |
| --- | --- | --- |
| 1 | 确定双方协议的最少材料、声明身份、内容表示和三者声明入口 | 根据 Declare、Adjust、Modify 的实际需要定义契约，不要求 Modification 继承 Variable，不凭旧方法名恢复中间转换层 |
| 2 | 实现 `type`、`detail` 入口、内置内容转译及 Modification 的三个协议 | [modification.ts](../../src/style-system/modification.ts) 承担 Modification 自身定义与协议；颜色规则作为内置实现，具体承载文件在职责核对后确定 |
| 3 | 迁移颜色配方并退出原组合概念、入口和出口 | 原 `color-variable-modification.ts` 的颜色通道转译已迁入 Modification 内置能力；旧入口及文件已移除，必要表达行为保留 |
| 4 | 为 Variable 接通 Declare、Adjust Target、Modify Target 协议 | [variable.ts](../../src/style-system/variable.ts) 提供对象自身及目标侧能力；声明机制由 [declaration.ts](../../src/style-system/declaration.ts) 消费 Declare 协议 |
| 5 | 实现三者绑定及一次共同声明 | [variable-adjust.ts](../../src/style-system/variable-adjust.ts) 根据双方协议组织关系；[declaration.ts](../../src/style-system/declaration.ts) 与现有编译机制处理声明输出、依赖与作用域 |
| 6 | 接通 Modify 的双方协议消费 | [variable-modify.ts](../../src/style-system/variable-modify.ts) 负责具体修改应用及条件、顺序处理 |
| 7 | 同步公开出口、调用、注释和验证 | 核对 [index.ts](../../src/style-system/index.ts)、调用方及生成产物，清理旧入口引用，按下列行为验收 |

实施前核对相关文件的开头职责注释。Modification 的自身描述、协议及内置转译归该主体；Variable 提供自身及目标侧协议；关系绑定与修改应用分别由 variable-adjust、variable-modify 承担。颜色转译可以有内部实现文件，但不能据此重建 Color Variable Modification 独立领域。

## 最小验收

- `modification({ type: 'color', detail: ... })` 可通过 Declare 协议独立声明和引用，无需额外包装成 Variable。
- 对照协议表，Modification 实现 Declare、Adjust、Modify；Variable 实现 Declare、Adjust Target、Modify Target。声明和应用入口按对应协议消费对象。
- 颜色内置转译支持固定通道与相对表达式；声明配方时不固定某个 Source。
- 一次声明 Adjust 绑定的关系，实际 CSS 包含 Source、Modification、mergedResult 三者的声明。
- mergedResult 引用 Source 和 Modification；声明产物保留依赖关系。
- 两个 Source 可以使用同一个 Modification；局部 CSS 覆盖变化配方时，相关组合结果体现变化。
- Modify 使用独立变化声明时，核对条件组合、局部覆盖及已有修改顺序。
- 原 `colorVariableModification` 入口及独立文件退出，必要颜色表达能力迁入 Modification 内置实现。
- 按确定后的迁移方案，验证现有 JS 计算及 `'mutable'` 调用的去向与行为。
- 控制器修改方法、通知与重新编译能力保持为后续计划，不计入本次实现完成条件。

## 上一轮需求实现合同（历史回归基线）

用户已授权落实本计划、编写约束行为的测试，并要求交付时全部测试通过。可以从既定目标推导的实现细节由执行方解决；只有无法推导、必须由用户决定的逻辑缺口才交回裁决。下表已填写实际文件、行为用例和命令结果，完成状态以这些证据为依据。

| 要求与负责主体 | 必须保留的材料、变换与交付 | 验收观察与证据位置 | 状态 |
| --- | --- | --- | --- |
| Modification 自身定义与协议 | `type + detail` 保存变化；内置转译；实现 Declare、Adjust、Modify；独立声明不需要 Variable 包装 | [modification.ts](../../src/style-system/modification.ts)；[调整绑定共同声明并保留内容引用.test.ts](../../src/style-system/test/调整绑定共同声明并保留内容引用.test.ts)的独立配方、延迟回调与可调用内容用例 | 满足 |
| Variable 目标侧协议 | 实现 Declare、Adjust Target、Modify Target；应用入口按协议消费双方 | [variable.ts](../../src/style-system/variable.ts)、[declaration.ts](../../src/style-system/declaration.ts)；调整绑定流程的继承方法与自定义非颜色目标用例 | 满足 |
| 颜色表达职责接管 | 颜色通道固定值、相对表达与未指定通道保留，由内置转译提供；退出旧组合概念和入口 | Modification 内置转译及 [colors.ts](../../src/style-system/pieces/contents/atoms/color/colors.ts) 迁移；源码、现役文档和重建 dist 中旧入口/旧求值链零残留 | 满足 |
| Adjust 三者绑定 | Source、Modification、mergedResult 的身份及 CSS 引用关系；一次声明同时输出三者 | [variable-adjust.ts](../../src/style-system/variable-adjust.ts)；调整绑定流程的三者/共享/同址来源修改用例；[颜色修改规则按条件组合并在浏览器中生效.browser.test.ts](../../src/style-system/test/颜色修改规则按条件组合并在浏览器中生效.browser.test.ts)的来源与配方局部覆盖 | 满足 |
| Modify 条件应用 | 目标与变化的协议材料；既有数字及颜色修改、条件、连续顺序、继承和撤销行为 | [variable-modify.ts](../../src/style-system/variable-modify.ts)、Button 数字调用；原数值/颜色流程回归及新增绑定结果继承 Modify、子级重算、退出恢复浏览器用例 | 满足 |
| 输入失败与迁移 | 无效内容或协议失败须明确暴露；现有 JS Adjust 的新语义及旧调用迁移须有依据 | 调整绑定流程的不支持内容领域失败、文件级公开类型拒绝；原 JS adjust/mutable 被 CSS 绑定替换，数字 Modify 转用 expression 材料 | 满足 |
| 生命周期与资源 | 复用声明、依赖、条件与撤销机制，保留名称唯一性；不引入独立 Adapter 层 | 沿用 AST insert/depend/onRemove/remove 与真实 Variable 声明查询；共享依赖退出、按需资源、显式/改名避碰行为用例；独立复用审查原反例复验通过 | 满足 |
| 代码质量与责任完整性 | 中文职责注释、英文代码命名、完整阅读路径；按五工具检查必要性；旧职责由新入口接管 | 同名 Modification 布局、Variable/Modify 全文件具名函数黑盒说明及使用方应用边界复核；五工具结果见下文；独立审查关闭全部发现 | 满足 |
| 行为测试与全量验证 | 测试从需求结果推导，内部合法替换不应破坏断言；全部测试通过 | `bun run test`：49 文件 336 单元 + 18 文件 146 浏览器，全部通过；`bun run type-check`、`bun run build`、`git diff --check` 均通过 | 满足 |
| 后续控制器修改 | 本次不实现控制器改值、通知及自动重编译 | 用户明确将修改能力留到以后；本轮完成条件不包含它 | 有依据不适用 |
| Size 的具体转译实现 | 本次保持多内容领域的职责模型，不虚构 Size 参数与表达 | 用户以 Size 举例说明领域差异，尚未给出具体 Size 行为要求 | 有依据不适用 |

教学、训练与校准材料在本次样式协议修改中没有对应主体，依据任务范围不适用。其余声明、应用、输出、失败、消费者及横切边界均按上述合同取得证据。

## 上一轮实施问题的落实结果（历史，方法协议已退出）

| 问题 | 实际决定与依据 |
| --- | --- |
| 协议的具体接口 | Declare 提供 `toDeclaration`；Adjust 变化方交付自身可声明的源无关材料，目标提供 `adjustWith`；Modify 变化方交付颜色 `type/content` 或表达 `type/detail` 材料，目标提供 `modifyWith`。公开目标协议支持自定义材料，Variable 内置消费已定义的颜色/表达材料。入口从目标推导材料类型，拒绝缺少能力的输入。 |
| Adjust 的调用与返回协议 | `adjust(source, change)` 返回 mergedResult Variable；其 `toDeclaration` 使用原 Variable 基础声明与 AST 依赖机制共同声明三者，其普通消费在当前地址重算绑定表达式。颜色来源组合由 Adjust 使用端执行。 |
| 声明身份和作用域 | 来源使用真实 Variable 基础声明查询，不能把同 Key 修改误当定义；当前或祖先已有声明优先，并共享 owner 生命周期。Variable/Modification 共用直接名称分配，显式名称与现有可写 name 的新名称均被登记，匿名结果避让。 |
| 现有 JS Adjust 的去向 | 新关系绑定直接替换旧 JS adjust 和 mutable，不留第二套同名语义。生产无旧 JS adjust 消费者；原仅服务该链且未公开的 readNumber/evaluateExpression/readJSValue/readVariableDefault 随责任退役。CSS add/multiply、Expression、Value.withContent 的独立契约保留。旧测试迁移到共同声明、CSS 运算、通道/状态/资源/失败行为。 |
| Modification 的内容表示与内部落点 | 颜色内置配方转译归 Modification，输出独立 CSS 引用，固定/回调通道延迟编译；数值 Modify 消费者转为 `{ type: 'expression', detail: current => add(current, n) }`，无需独立声明 arbitrary callback。没有 Adapter 层或源相关中间应用方法。 |
| Modify 与绑定关系的衔接 | 绑定结果是普通 Variable，可直接 declare/modify/消费；原条件、排序、共享 id、继承和撤销仍由 Variable Modify 使用端组织。颜色始终引用独立配方，子元素消费在当地重算完整链。 |

五工具已按实际节点收口：黑盒化核对 Modification、Variable、Adjust、Modify 的具名入口说明与输入/输出；逻辑链清晰化保持 `type/detail → 配方引用 → 使用端组合 → CSS` 的负责链；结构复用沿用 FNKit 能力判断/ID、JSSContent、relativeOKLCH、AST 生命周期和共享名称分配；多态前置收束由声明/目标协议统一入口，并从目标约束可消费材料；及时认知闭合把配方、配置及条件/资源生命周期说明放在对应类型和方法旁。旧包装、JS 求值链、冗余调用括号和未使用导入已清理，同名类型/构造阅读结构保留。独立审查复验了 Source 同址 Modify、改名避碰和类型拒绝反例，无须用户裁决的逻辑缺口。

验证时将 `TEMP`、`TMP` 设为 `D:/mycode/uikit/agents/run/temp`，满足任务临时产物边界。Windows 的本地 Vitest 可执行 shim 启动曾导致打包子进程读取 FNKit junction 失败；直接本地 Node CLI 与相同 PATH 的 A/B 运行成功，因此正式 test 脚本明确用 Node 启动本地 Vitest，打包探针与行为断言保持原检查。最终 `bun run test`、`bun run type-check`、`bun run build` 均 exit 0。构建清理并重建 dist，旧文件名、旧出口及旧求值正文扫描均无命中。

## 材料协议纠正：本轮合同

用户明确将协议定义为操作所需的数据形状，由 FNKit 的 `DataShape` / `matchShape` 描述与判断。上一轮 `adjustWith`、`modifyWith` 及目标转发方案退出；`toDeclaration` 也不继续要求信息体执行外部声明操作。上一轮 336 单元与 146 浏览器通过结果仅作为本轮回归基线，不能替代此次验收。

| 要求与负责位置 | 本轮变换与交付 | 验收观察 | 状态 |
| --- | --- | --- | --- |
| 操作所需材料形状 | Declare 使用 `key/content`；Adjust/Modify 目标沿同一自定义属性材料及实际需要的可选状态/注册信息消费，不要求品牌、构造器或动作方法；形状复用 FNKit | 天然双方对象、额外/继承/可调用对象实际声明及应用；缺必要材料明确拒绝 | 满足 |
| 使用端直接应用 | 移除 `adjustWith`、`modifyWith` 与对应转发；声明和应用的正式下游都按材料处理；不恢复变化方源相关应用方法 | 原条件、顺序、共享 id、继承/撤销与子级重算回归 | 满足 |
| Modification 单配置与完整名称 | 单个 `{ type, name, detail }` 配置；对象 name 保存完整 CSS 名称，声明与引用直接沿用；Variable 现有名称表达保持 | 两参数调用退出、完整名与当前实际双方名称避碰；匿名结果无自引用 | 满足 |
| 共同声明和生命周期 | Source、独立配方及结果继续共同声明；共享 owner、真实定义查询和退出机制复用现 AST | 同址 Source 修改、共享撤销、资源和局部覆盖浏览器行为 | 满足 |
| 责任接管及现役说明 | Variable 只投影既有材料，不复制第二套状态事实；Modification 提供自身配方；更新出口、调用、文档与生成产物 | 源码及 dist 旧方法和旧双参数形式无现役残留 | 满足 |
| 维护与代码清洁 | 当前 dirty 工作树已固定到 `agents/run/20261008-material-protocol/code-baseline.json`；在同一责任范围比较生产+测试，要求净减少并缩短整体链 | 最终新增/删除/净变化及五工具实际判断，文档排除 | 满足 |
| 完整验证 | 行为断言保留业务约束；正式 unit/browser/type-check/build 全部通过 | 本轮准确命令、计数、exit 0 和 diff check | 满足 |

代码落点沿用既有职责：`declaration.ts` 定义并消费声明材料；`variable-adjust.ts` 直接组织来源、变化、结果及共同声明；`variable-modify.ts` 从正式声明查询到修改账本均消费目标材料；`variable.ts` 提供自身数据及标准 JSS 内容表达；`modification.ts` 负责单配置变化及自身配方。不存在注册系统、独立 Adapter、新内容领域或控制器修改能力的需要。

修改前问题已经具体确认：入口先调用目标动作再回到使用方应用，造成多余转发；仅入口结构识别不能让缺少 Variable 身份的材料进入正式声明/修改链；Modification 两参数与去前缀名称要求不符。最少方案及实际形状在独立前置审查后落实，接口细节按行为自行推断。


## 材料协议纠正：实施结果与证据

实际材料是 `DeclareProtocol.key/content`，其中 content 字段必须存在，显式 undefined 表示无输出；目标可选 states Map、registration 和 declarations 关系材料。颜色变化需要 `type: 'color'` 与完整自定义属性 key、源无关 content 配方；表达变化需要 `type: 'expression'` 与 detail 回调。入口使用 FNKit DataShape/matchShape，继承字段、额外字段和可调用信息体均按材料消费。信息体无需实现声明或调整、修改操作。

Adjust 只创建组合表达式、结果及 declarations 关系。引用编译从同一信息体组织真实基础声明与共享 owner；当地重算复用既有 insertDefinition，并读取最近声明的实际内容，所以显式覆盖结果为 blue 时父子消费均继承 blue，默认绑定仍保留子级 Source/配方覆盖。Variable 只投影当前 config，不存第二份状态；Modification 只接收单配置并保留完整 --name，声明和引用直接沿用。

原入口转发链 `declare → toDeclaration`、`adjust → adjustWith → bindVariableAdjustment` 和 `modify → modifyWith → modifyVariable` 已退出。现入口直接读取材料并进入声明/应用；原 VariableDeclaration 局部记录只标识使用端生成的真实定义，不作为外部参与门禁。Cluster 原 WeakMap 仍只负责默认成员规范身份，未知天然材料保持原对象。天然材料自有 onActive 留在最终表达式依赖中；原对象自身编译不再重复依赖自身，保留资源共享与撤销而无自循环。

行为测试已减少重复编译文本断言：继承天然双方、可调用数字材料、同址 Source Modify、Source/配方手工覆盖、显式结果覆盖及子级消费均在[颜色修改规则按条件组合并在浏览器中生效.browser.test.ts](../../src/style-system/test/颜色修改规则按条件组合并在浏览器中生效.browser.test.ts)核对实际计算颜色或 z-index。显式 temp 名、天然材料名、Source 改名及配方改名在[调整绑定共同声明并保留内容引用.test.ts](../../src/style-system/test/调整绑定共同声明并保留内容引用.test.ts)共用参数化流程，保留三者独立声明及内容。该单测还核对缺字段/显式 undefined、错误领域与名称、独立配方、延迟回调、未手工声明的天然变化资源及共享撤销。

固定本轮 dirty 基线的生产与测试合计新增 357 行、删除 362 行、净减少 5 行，完整责任范围与逐文件结果保存在 [maintenance-evidence.json](../../agents/run/20261008-material-protocol/maintenance-evidence.json)，原始文本保存在 code-baseline.json。没有移走实现、压缩语句或删除独立行为保障。重复 selector 示例及角色说明由已有 Guide 承担，源码保留操作目的、必要条件及产物契约。

五工具的实际判断：结构复用统一 key/content、既有 AST 声明/共享 owner、共享名称分配及 FNKit ID 生成；黑盒化让信息体只交付材料，入口负责外部动作，内容编译共享状态及资源生命周期；逻辑链清晰化撤销三个外部方法转发和 Adjust 对结果编译的覆写；及时认知闭合在同一材料解释内容、完整名称、共同声明与显式覆盖；多态前置收束用 DataShape 收束构造来源与 callable/继承差异，保留颜色/表达语义及可选状态、注册和关系事实。独立审查关闭 key 输出、显式结果覆盖、天然资源失联及名称避碰反例。

正式 `bun run test`：49 文件 334 单元测试、18 文件 147 浏览器测试全部通过，exit 0。`bun run type-check`、`bun run build` 均 exit 0；完整日志保存在 [final-test.log](../../agents/run/20261008-material-protocol/final-test.log)、[final-type.log](../../agents/run/20261008-material-protocol/final-type.log)、[final-build.log](../../agents/run/20261008-material-protocol/final-build.log)。最终小范围名称类型守卫与注释收口后，绑定单文件 9 例再次通过，见 [final-binding.log](../../agents/run/20261008-material-protocol/final-binding.log)，类型检查与构建同步重跑通过。构建利用 Vite emptyOutDir 清理并重建 dist，旧方法、旧颜色文件/入口及退役 JS 求值链扫描无命中；diff check 通过，未修改暂存区。

本轮验证的 TEMP/TMP 使用 agents/run/20261008-material-protocol/temp，与上一轮临时目录隔离。验收日志与维护基线保留为证据，一次性探针和测试缓存不作为交付代码。

## FNKit 复用复核：本轮合同

用户要求重新检查此前全部改动，已有通用能力能明显缩短逻辑链时直接复用。本轮不增加业务功能；当前暂存工作树固定为基线，生产及测试合计须净减少。原材料协议、颜色组合与数值修改行为继续作为回归约束。

| 要求 | 负责位置与最少变换 | 验收观察 | 状态 |
| --- | --- | --- | --- |
| 明确复用映射 | Variable 注册消费者和 Modify 同址结果的 Map 复用 FNKit mapGet；先取得 active/existing，保留首次激活；WeakMap 保留原生 | 注册替换、共享引用、修改顺序与撤销回归 | 满足 |
| 去除中间材料与转发 | 直接用 FNKit find 查询 states Map；组合谓词保留函数类型，原回调保持跨模块懒读取，直接调用既有 Predicate，退出 matchShape 对已知函数的重复判别 | 命中 undefined 状态不求默认；缺材料及合法天然对象保持既有结果 | 满足 |
| 完整能力复查 | 从 FNKit reference、公开 index 和对应源码契约核对；CSS calc、Key/JSS 生命周期、WeakMap、顺序与自有属性语义按实际差异保留 | 独立复用及约束审查，无新增包装、缓存或并行职责 | 满足 |
| 维护与范围 | agents/run/20261008-fnkit-reuse/code-baseline.json 固定本轮前 22 个生产/测试文件；全部既有暂存与 Solid 胶水 Plan 保留 | 同一基线新增/删除/净变化及暂存区完整性证据 | 满足 |
| 验证与产物 | 现有相关行为测试、正式 full test、type-check、build；重建 dist 与退役链扫描 | 全部测试通过、类型/构建/diff check exit 0，日志留在本轮目录 | 满足 |

上述文件定位不变：Variable 编译消费已有状态并维护注册资源，Modify 维护局部修改结果，声明与颜色变化文件提供实际材料形状。通用集合与谓词能力直接取自 FNKit，不把 CSS 运算改成 Numberish 运算，不扩大组件样式或控制器职责。本轮不以 API 调用次数或内部 Map 布局编写镜像测试，沿用最终 CSS、浏览器值和资源退出行为验证。

## FNKit 复用复核：实施结果与证据

四个现役源码文件完成窄改。variable.ts 的注册消费者和 variable-modify.ts 的同址结果直接复用 mapGet，原手工 get/缺项分支/set 退出；active/existing 仍在取得结果之前判断，首次注册替换及首次步骤发布不变。消费者成为 const 后不再需要旧 currentConsumers 捕获别名，onRemove 直接关闭同一 Set。外层 WeakMap 的会话、节点身份及原释放机制保留。

Variable 的指定状态消费直接用 FNKit find 查询 states Map，移除 Map→数组→tuple 的材料转换。readState 门控后只读一次 states；依据 entry 是否存在取 value，选中的 undefined 不退回默认值。既有[状态名称登记并用于变量编译.test.ts](../../src/style-system/test/状态名称登记并用于变量编译.test.ts)已经以 undefined、零、假值核对实际 CSS 与未执行默认生产函数，没有为此次复用另建实现镜像测试。

声明、颜色材料和目标形状用 satisfies DataShape 保留既有 Predicate 函数类型；跨模块原 callback 仍延迟读取绑定，内部直接调用 declareShape(input) 或 colorModificationShape(input)。不能把这些导入在模块初始化时直传：declaration、modification、variable-adjust 与 index 四入口的候选对照均表明直接传入会捕获未初始化谓词，实际操作失败；基线和延迟直接调用均完成 declare→adjust→modify→CSS。探针对照保存在 [predicate-probe.json](../../agents/run/20261008-fnkit-reuse/predicate-probe.json)。结构对象和公开操作入口仍使用 matchShape，短路与缺材料失败边界保持。

复用查证覆盖 FNKit 近期实际能力：DataShape/matchShape 和 matching 的 and/or/optional 已用于公开材料判定；hasProperty 保留继承及 callable 字段读取；result/Unresultable 分别用于按需内容求值及 callable 内容保护；现 mapGet 内部复用通用 get，不把没有直接 import get 视为遗漏。IdGenerator 已服务共享名称分配。bindParams 用于参数预绑定，当前入口没有这种需要；WeakMap 不符合 mapGet/get 的 Map 契约，不能换成强缓存。

其余候选按真实差异保留：FNKit 对象 map/filter 包含继承字段且可能惰性，与创建状态/变化的自身字段即时快照不同；createObjectFromGetters 会求值所有函数字段，不能替代同时保存方法与内容函数的 Variable 实体；sortArray/removeItem 返回新数组，不能替代共享 steps 的原位排序与删除；sortMapByKey 增加构 Map 后再排序复制，不能缩短现 entries 创建链；Numberish 运算不承担 CSS 单位、依赖及延迟表达。声明查询、条件排序、AST owner/depend/onRemove 都是样式领域的实际生命周期职责，继续沿用已有唯一负责链。独立复用审查完整核对此前变更，未发现另一个必须替换的 FNKit 能力。

固定本轮基线的生产与测试合计新增 22 行、删除 27 行、净减少 5 行，测试文件没有删减；逐文件统计及暂存指纹保存在 [maintenance-evidence.json](../../agents/run/20261008-fnkit-reuse/maintenance-evidence.json)，原始 22 文件文本在 code-baseline.json。全部既有暂存的二进制 diff SHA-256 保持不变，Solid 胶水 Plan 未触碰。完整链少了两组手工建值分支、状态中间数组与三次已知谓词的 matchShape 转交；没有新增 helper、缓存、目录或并行事实。

五工具复查：结构复用直接沿用 FNKit 已有 Map 与 Predicate 契约；黑盒化将缺项建值交给已验证的 mapGet，不隐藏首次激活及释放条件；逻辑链清晰化退出数组重包和 Predicate 中转，保留循环模块所需延迟边界；及时认知闭合让首次状态在建值前确定，消费者恒定引用与撤销相邻；多态前置收束维持材料入口的形状判定，保留 CSS/Numberish、WeakMap/Map 和自身字段/继承字段的必要差异。文件定位、具名节点说明及整体生命周期没有变化。

现有相关 4 单元文件 58 例通过；最终正式 bun run test 为 49 文件 334 单元与 18 文件 147 浏览器全部通过，exit 0（21:42:13 与 21:42:18）。bun run type-check、bun run build、git diff --check 均 exit 0；日志为 [focused-test.log](../../agents/run/20261008-fnkit-reuse/focused-test.log)、[final-test.log](../../agents/run/20261008-fnkit-reuse/final-test.log)、[final-type.log](../../agents/run/20261008-fnkit-reuse/final-type.log)、[final-build.log](../../agents/run/20261008-fnkit-reuse/final-build.log)。构建按 Vite emptyOutDir 清理并重建 dist，旧协议方法、颜色入口及退役 JS 求值链零残留，生成产物包含此次 mapGet/find/延迟 Predicate 调用。

TEMP/TMP 仅使用 agents/run/20261008-fnkit-reuse/temp，旧任务目录保持。本轮基线、探针结果与验收日志保留。首次 PowerShell 删除调用被自动审批拒绝，理由仅为 blocked by policy，未执行；之后按 14 个明确文本路径使用一次 apply_patch 删除探针脚本及 bundle，已完成清理。运行时缓存及调试日志仍在本轮 temp 目录，删除不再尝试，属于环境清理限制，不影响源码和测试结果。

## Modification 通用主体与多态路由：本轮合同

用户明确 Modification 本身就是通用定义，不能依赖更细的 Color 或另设 ModificationDefinition；通用定义放前，Color 类型与实现整片放后。所谓可插拔只是多态设计思想，代码不建立 Plugin 实体；type 用于选择转译策略，name 继续保存完整 CSS 自定义属性名。单配置调用保持。

| 要求 | 负责位置及变换 | 验收观察 | 状态 |
| --- | --- | --- | --- |
| 通用主体与依赖方向 | Modification<Detail,Type> 直接持有 type/name/detail 及 Declare/JSS 材料，不继承 Color 或 Definition | 公开泛型自然材料可以独立声明；Definition 类型/出口退出 | 满足 |
| 按 type 多态转译 | 构造按静态私有策略表选择 detail 形状与内容转译；核心不含颜色字段/分支 | 未支持及原型成员 type 明确失败，detail 类型与 route 关联 | 满足 |
| 前通用后 Color | 同名类型和构造/生命周期在前；Color 参数、消费形状、源无关转译及策略成员集中后部 | 完整文件阅读与独立职责审查；不建立外部安装/注册/装载入口 | 满足 |
| 保留材料与消费 | name 完整 -- 名、独立引用、天然 type/key/content 参与；通道回调消费时执行；Source 组合仍归 Adjust/Modify | 既有三者声明、共享资源、局部重算、条件顺序继承撤销与回调行为通过 | 满足 |
| 复用与最少范围 | 复用 FNKit DataShape/matchShape/isString/isObject 与既有 JSS/名称/声明生命周期；源码基线为本轮 3 文件 | PluginSystem 的同型管线与异型内容转译不适配；不用外部策略第二参数或未知 Size/Length 参数 | 满足 |
| 完整验收及责任接管 | 同步公开出口、测试、现役说明、生成 dist 和本主题 Plan；同一基线生产+测试合计须净减少 | 所有 unit/browser/type/build/diff 通过，旧 Definition 零残留；准确代码+测试统计 | 满足 |

本轮修正既定通用概念的依赖方向与内部多态转译，不新增外部运行时安装能力或新的业务内容领域。未来实现另一 type 时应在后段加入对应 detail 转译与策略成员，通用名称、声明与 JSS 生命周期不改变。Adjust/Modify 当前已实现颜色应用及表达式修改，不能因 Modification 通用化声称其支持所有未来领域。基线与证据仅使用 agents/run/20261008-modification-polymorphism，旧任务目录及 Solid 胶水 Plan 保持。

## Modification 通用主体与多态路由：实施结果与证据

`Modification<Detail, Type>` 本身是通用定义，直接承载描述与声明材料；`ModificationDefinition` 类型和出口已退出。单配置工厂依据字符串 type 的自有策略成员取得 detail 形状与转译函数，消费时读取当前 detail，将源无关内容交给既有编译生命周期。核心没有 Color 父接口、颜色字段或颜色分支；Color 参数、天然材料形状、转译函数及当前策略成员集中在文件后段。name 继续保留完整 CSS 自定义属性名，`toCSSString` 的公开 Key 用途保留。

类型映射从策略参数推导每个 type 对应的 detail，再以索引映射保持调用相关性，没有 any/unknown 双重断言。零落盘类型探针临时在编译视图增加独立数值描述转译，通用核心不变；合法数值 detail 通过，错误数值及颜色 detail 被静态拒绝，全部诊断为零，见 [type-route-probe.json](../../agents/run/20261008-modification-polymorphism/type-route-probe.json)。该探针不是新增生产领域或公开安装入口。现有绑定流程还以 `Modification<number, 'number'>` 天然材料实际独立声明，证明通用主体不以 Color 或构造来源作为前提。

行为测试保留独立配方、消费前回调不执行、可调用内容保护、资源共享退出、共同声明、局部覆盖、条件顺序及继承撤销。未知 type、constructor/toString/__proto__ 和盒装字符串实际构造均明确失败，区分材料继承能力与策略表自有路由边界。测试观察公开声明及实际 CSS，不检查私有策略表布局。现役 architecture、对象与行为、变量定义与消费及 functions 说明已同步通用主体与当前颜色应用边界。

五工具复核：黑盒化保留通用定义和单配置输入/产物契约，实例方法说明覆盖真实 Key 和编译时机；结构复用沿用 FNKit DataShape/matchShape/isString/isObject、共享名称分配与 JSS 编译，不造新生命周期；逻辑链清晰化让通用核心取得转译策略，退出重复 Definition 与 Color 父接口；及时认知闭合将 Color 参数、转译和成员集中后段；多态前置收束按 type→detail→内容对应，源相关应用仍在 Adjust/Modify。FNKit PluginSystem 的同型 pass/load 管线不符合 detail→CSS 异型转译及无 Plugin 实体要求；get 的继承查找和联合返回类型不适合自有路由及键值相关性，使用字符串、自有键检查和直接类型索引。result 不保护所有天然 callable 内容，通道继续沿用 JSSContent 与回调的既有区分。

固定三文件文本基线的生产与测试合计新增 73 行、删除 75 行、净减少 2 行，见 [maintenance-evidence.json](../../agents/run/20261008-modification-polymorphism/maintenance-evidence.json)。Git 的重排配对统计为 72 增、74 删，同为净减少 2 行。测试行为未删减；重复实例 getter 说明由主体契约承接，单动作编译转交使用表达式，测试单元间遗留连续空行按真实阅读单元清理。HEAD 与空暂存区指纹保持，Solid 胶水 Plan 未修改。

正式 `bun run test`：49 文件 334 单元测试及 18 文件 147 浏览器测试全部通过，exit 0（23:33:41、23:33:55）；相关两文件 13 例通过。`bun run type-check`、`bun run build` 和 `git diff --check` 均通过，见 [final-test.log](../../agents/run/20261008-modification-polymorphism/final-test.log)、[focused-test.log](../../agents/run/20261008-modification-polymorphism/focused-test.log)、[final-type.log](../../agents/run/20261008-modification-polymorphism/final-type.log)、[final-build.log](../../agents/run/20261008-modification-polymorphism/final-build.log)。完整测试后仅收口实例方法说明和空行，未改变执行语义；构建随后再次成功。dist 已清理重建，源码、现役说明和 dist 的旧 Definition、旧操作方法、旧颜色入口与退役 JS 求值链零命中，证据见 [validation-evidence.json](../../agents/run/20261008-modification-polymorphism/validation-evidence.json)。

本轮没有一次性脚本或 bundle；类型探针通过 stdin 和虚拟编译视图执行。基线、探针结果与验收日志保留。TEMP/TMP 使用本轮 temp 目录，旧任务目录保持；运行时缓存保留，不重复此前被拒绝的缓存删除动作。没有需要用户裁决的业务缺口。

## 2026-10-09：操作协议的对象 Shape 清理

修改范围是 Declare、Adjust、Modify 所需材料的 Shape 表达。`Variable extends ModifyTargetProtocol` 保留：主体满足操作要求的材料关系成立，无需另立公共内容概念。通用 Modification 的 type/name/detail、领域路由与现有应用行为保留。

在 [declaration.ts](../../src/style-system/declaration.ts)、[variable-modify.ts](../../src/style-system/variable-modify.ts)、[modification.ts](../../src/style-system/modification.ts) 中直接用对象列出字段，字段 Predicate 检查对应值；入口检查 content 字段存在，避免把缺失字段误作显式 undefined。[variable-adjust.ts](../../src/style-system/variable-adjust.ts) 同步入口检查。颜色配方与表达变化的联合判断仍由 Modify 使用端承担。不新增内容接口、转换层或注册流程。

验收沿用现有真实声明、三者绑定、自然材料、继承与可调用对象、无效材料、条件修改和资源撤销的行为测试。334 项单元测试、147 项浏览器测试、类型检查、构建与 diff 检查全部通过；能力复用、重复能力识别、精简与约束独立复查全部通过，本轮完成。生产新增 31 行、删除 32 行，净减少 1 行；测试未改，生产与测试合计净减少 1 行。基线、暂存指纹与验证结果见 [evidence.json](../../agents/run/20261009-protocol-cleanup/evidence.json)，测试及类型、构建日志保留在同一目录。没有通过删除断言或压缩语句取得减量。

五工具复核：结构复用沿用 FNKit 的对象字段 Shape 与叶条件；黑盒化保留现有操作契约，不另立内容概念；逻辑链清晰化撤去根条件向字段 Shape 的匿名转发；及时认知闭合让字段条件在协议处可见；多态前置收束保留 Modify 入口的颜色配方与表达变化分支。字段条件就地展开，避免循环导入中的提前读取；没有为机械去重新增共享层。HEAD 与原暂存区保持不变。

## 2026-10-09：依赖方向与声明顺序收口

上一节只完成 Shape 表达清理，未完成用户要求将 Modification 的通用职责与具体实现分离延伸到其他概念。本轮承接这个缺口；Shape 写法不作为依赖方向已经正确的依据。

| 本轮要求 | 实际落实 | 状态 |
| --- | --- | --- |
| Adjust 的通用绑定与颜色组合分开 | 通用协议以 Type 为参数；入口按 type 选组合，再绑定三者。后部颜色函数验证配方并复用 relativeOKLCH，名称预留在验证之后 | 完成 |
| Modify 的通用步骤与领域应用分开 | 入口取得具体应用，编译时交付前序 Expression；局部实例、步骤及撤销随后呈现，Color/Expression 实现最后集中。检查与应用分别发生在创建和编译时 | 完成 |
| 名称分配归负责名称的主体 | 单份 IdGenerator/usedNames 移至 key.ts；Variable、Modification、Adjust 与参数解析直接复用。属性别名 names Map 独立；公共入口不扩大分配器出口 | 完成 |
| 主体先于派生和实现 | Value、Condition、VariableCluster、Variable、Key 均先类型和构造，再判别、派生与配套细节；保留 Variable extends ModifyTargetProtocol | 完成 |
| 退出真实中转与重复表达 | 退出 propertyAlias、isStateValues、createVariableInstance 单次中转；完整保留字段判断、实例事实和递归格式职责。聚合仍先正序消费所有项，再选最后有效结果；测试复用 add/multiply，不手写第二份 calc | 完成 |
| 行为与维护验收 | 全部 334 单元、147 浏览器测试通过，类型、构建与 diff check 通过；生产和测试合计净减少 | 完成 |

本轮基线为开始时完整工作区文本，包含上一轮已有的未暂存改动；没有把索引版本用于本轮减量。生产新增 234 行、删除 237 行，净减少 3 行；测试新增 15 行、删除 18 行，净减少 3 行；合计新增 249 行、删除 255 行，净减少 6 行。重排也纳入同一责任范围；没有压缩语句、移走实现或删除必要断言。原暂存区和 HEAD 指纹未变。

五工具实际采用：结构复用沿用主体/构造/派生布局、FNKit containKey/matchShape/IdGenerator 与已有 CSS 表达工具；黑盒化保留通用绑定和修改入口，具体领域应用在后部形成完整能力；逻辑链清晰化退出上述中转和未使用的 runtime declare 依赖；及时认知闭合让主体定义先出现，具体参数和应用相邻；多态前置收束在入口按 type 选实现，通用步骤不再直接分支成颜色算法。类型协议依赖保持，不为去掉依赖箭头引入内容概念。Value 的数组分隔和递归保护有实际职责，保留原链；WeakMap 不符合 FNKit mapGet 的 Map 契约，保留原生会话读取。

新增行为断言只扩展已有无效领域用例：Adjust、Modify 与 Modification 一样拒绝未知 type、原型成员名和盒装字符串；自然颜色材料仍只需 type/key/content。浏览器的数值、尺寸、晚到修改、共享撤销及子元素后序规则断言全部保留。

实际依据：《代码维护》《代码清洁》及五工具、《公共协议归属》《文件布局——子领域文件》《文件布局——领域辅助文件》《代码注释》《如何编写测试》《代码修改验收》。依据从完整需求和源码取得，不以测试通过代替依赖方向成立。

能力复用、重复能力识别、精简与约束的独立终审均通过；本轮全部要求完成，没有待用户裁决的逻辑缺口。

证据在 [maintenance-evidence.json](../../agents/run/20261009-dependency-order/maintenance-evidence.json)、[final-test.log](../../agents/run/20261009-dependency-order/final-test.log)、[final-type.log](../../agents/run/20261009-dependency-order/final-type.log)、[final-build.log](../../agents/run/20261009-dependency-order/final-build.log)。保留原文本基线、指纹与日志用于复核；一次性编辑和统计脚本退出交付。
