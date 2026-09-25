# Style System 语义节点与条件地址 Plan

> 状态：TODO。AST 初版已有[实施详情](StyleSystem语义节点与条件地址_实施详情.md)；本次“能力迁移、不保留旧写法”的新裁决尚未施工和验收。本 Plan 只负责语义节点编译链，施工按 Bcoin 项目的[Plan 落地契约](../../../bcoin-machine-learning/docs/how-to-apply-plan.md)执行；属性值聚合由独立的 [CSS 属性值贡献与聚合 Plan](StyleSystem属性值贡献与聚合.md) 承接。

初始语义节点与规则改写视图的关系另见附属 [二次清理 Plan](StyleSystem语义节点与条件地址_二次清理.md)；该讨论稿不改变本 Plan 已记录的实施状态。

## 目标与边界

编译链是：业务规则登记到 CSSRoot → `styleNodes` → 规则改写后的 `parsedStyleNodes` → `CSSString`。`styleNodes` 是业务规则与最终 CSS 文本之间可读取、可改写的有序语义节点队列；按普通 `conditionPath` 阅读时呈树状地址关系，实际存储无需是一棵嵌套树。规则改写需要在文本生成前看见节点的地址、状态和内容。当前 AST 初版已接通这条链，本次要检查它是否仍为旧写法留有多余责任。

**本轮让现役能力由新的 AST 链路完整承接，不为原来的写法保留兼容。** `rule()`／`rules()` 的旧输入形式、旧内部编译路径、旧异常时机、旧 CSS 字符串排版都不是验收合同；必要时可以改变接口，并同步迁移现役调用方，不建立兼容转发层或平行编译入口。若某种旧写法本身仍清楚地承担现役责任，也无需为了显示“重写”而机械替换。编译链交付 CSS 字符串、CSSRoot 成功后挂载及失败不提交部分结果的能力仍须成立，不固定旧编译函数的调用签名。普通声明、重复同名声明仍遵守 CSS 层叠；节点按队列保留来源顺序，不另发明 `order` 字段。本轮不改变任何 CSS property 的值组合语义。

“保留能力”具体指：业务仍能登记、更新和撤销规则；普通 Condition 与 State Condition 仍能分别表达地址与状态；Value、Variable、Cluster、按需依赖及循环检测、Variable 自动定义和状态优先级仍能完成各自用途；Button 等现役消费者仍可使用样式系统。验收这些能力要用施工后选定的写法走正式入口和真实消费者，不能用“旧调用仍可运行”代替，也不能借删除旧路径一并删掉现役功能。

语义模型的具体示例见 [JSS 样式节点树](../../src/style-system/doc/JSS样式节点树.md)。这里记录修改责任、信息流、验收与尚未确定的设计。

## 现役目录结构与缺口

以下是 AST 初版落地后的现役载体。缩进表示文件归属，不表示调用顺序。

```text
src/style-system/【目录】：Style System 的声明、登记与编译。
    rule.ts【文件】：保存规则登记、声明输入与节点改写内容协议。
    css-root.ts【文件】：保存源规则，编译并向宿主提交 CSS。
    condition.ts【文件】：定义普通 Condition 与路径。
    materials/【目录】：提供可登记的条件和其他样式材料。
        state-conditions.ts【文件】：保存 State Condition 身份、名称和中央顺序。
    compiler/【目录】：把已登记的 Rules 编译为 CSS 字符串。
        style-nodes.ts【文件】：定义待改写节点和已解析内容节点。
        compile-css.ts【文件】：展开 Rules、改写节点、读取内容与依赖，并组织输出。
        compile-value.ts【文件】：读取 Value 内容与嵌套引用。
        compile-variable.ts【文件】：读取 Variable 引用、source 与状态定义。
        records.ts【文件】：对 parsed 节点作保守分组；名称仍沿用已退出的 record 概念。
```

AST 初版已接通正式编译链，但仍有为旧行为留下的结构。例如 `style-nodes.ts` 的 `deferredStateConditions` 为无内容节点维持旧的未知状态报错时机；`records.ts` 的名称仍指向已退出的 CSSRecord。它们不是本轮必须保存的契约。施工先核对各自的现役责任，再删除、合并或准确命名，避免把旧路径误当 AST 的必要组成。

## 目标目录结构与责任

以下只画本轮能力迁移与结构收口的关键责任。动作标记表达目标责任，实际落点仍要由施工时的调用链核对；改写协议不由后续聚合需求反推。

```text
src/style-system/【目录】：继续拥有规则、材料和编译入口。
    compiler/【目录】：唯一的 Rules 到 CSSString 编译链。
        style-nodes.ts【更新，文件】：让可改写字段成为节点语义的唯一依据，删除仅为旧失败时机服务的附带状态。
        compile-css.ts【更新，文件】：构建、改写、求值并交付有序 parsed 节点，再交给字符串输出。
            resolveRules【更新，函数】：从源 Rules 展开有序 styleNodes，保留普通地址与状态路径。
            parseStyleNodes【更新，函数】：以改写后的节点为准求值，完成 parsed 内容节点。
        group-parsed-style-nodes.ts【重命名，文件】：由 records.ts 更名，仅对 parsed 节点作必要的保守分组。
    test/【目录】：现役跨文件测试。
        语义节点改写经正式登记输出CSS.test.ts【更新，文件】：按选定写法验证节点改写与现役能力迁移。
        语义节点改写后浏览器状态与挂载.browser.test.ts【更新，文件】：验证状态、层叠与挂载的真实浏览器结果。
    doc/【目录】：现役设计说明。
        JSS样式节点树.md【更新，文件】：与已落地 AST 及本次能力迁移边界一致，不再称节点链尚未实现。
    architecture.md【更新，文件】：只描述施工后真实存在的职责与调用链。
```

`style-nodes.ts` 保存节点形状；`compile-css.ts` 负责实际阶段转换，不能以类型存在冒充能力迁移完成。现有 `records.ts` 只负责 parsed 节点保守分组，更名后不保留旧文件名或转发层；若施工发现该责任其实不独立，先据实际调用链修订目标职责，不同时保留两套入口。Value 与 Variable 的求值能力分别由负责模块承接，接口和写法可改变，但不能出现新旧两套并行真相。

`condition.ts` 和 `materials/state-conditions.ts` 继续分别提供普通地址协议与状态身份。`css-root.ts` 的提交能力必须由唯一入口承接；`rule.ts` 的登记形式若需要改变，就迁移调用方，不要求旧 `rule()`／`rules()` 的调用形式继续兼容。未受影响的文件不为填满目标树机械修改。

## 本轮规则改写的最小协议

普通内容节点只承载一项 `[key, value]` 声明；来源里有多项声明，就按原顺序产生多个节点。这样重复 `key` 不丢失，每个 parsed 内容节点可追到对应的 CSS 输出。特殊节点仍是 `styleNodes` 队列中的对象，保存自身的 `conditionPath`、`stateConditionPath`、`key` 与内容。AST 初版由内容对象的 `rewriteStyleNodes(nodes, index, node)` 方法取得改写能力；施工可以调整输入形式，但正式业务规则仍须能触发节点改写，普通 CSS 内容不能自动取得改写身份。不因初版使用 `rule()`／`rules()` 登记，就要求旧调用形式永久兼容。

多项特殊规则按来源队列确定执行顺序；每个初始特殊节点至多执行一次，被前次改写删除的节点不再执行。改写可修改普通节点或插入普通内容节点；改写中新产生的特殊节点不隐式递归执行，进入 parsed 阶段仍有特殊节点就报错。这些是顺序与终止边界。AST 初版采用“先移除自身，再把剩余队列、当前位置和节点传给回调”的方式，施工可以调整方法名称、参数和调度实现，不要求旧回调签名兼容。

这一协议只建立 AST 改写能力。正式端到端用例使用非聚合的 Rule 改写普通声明，证明业务登记、节点队列变化、parsed 内容与 CSS 输出贯通；不借后续属性聚合规则充当测试样例。按需依赖生成的 Rules 仍须进入同一阶段边界，不得绕过节点改写直接拼入最终 CSS。

## 一次规则怎样走到 CSS

1. 业务按选定的登记写法形成有序 Rules；CSSRoot 持有源账本，编译时取快照。旧 `rule()`／`rules()` 形式不是这一阶段的兼容条件。
2. Compiler 从 Rules 建立 `styleNodes`。普通内容节点表达 `conditionPath`、`stateConditionPath`、`key`、`value`；改写节点在此基础上由内容对象提供改写方法。`conditionPath` 是声明受体的地址，`stateConditionPath` 是同一受体上的状态限制。节点在队列中的位置保留输入顺序。`[hover, focusVisible]` 在同一状态路径中表示两者同时成立，并非两个独立分支。
3. Rule 按上述协议读取、改写 `styleNodes`，直到只剩可输出的普通内容节点，形成 `parsedStyleNodes`。此时 `stateConditionPath` 并入输出用的 `conditionPath`；特殊规则节点必须消失。这里可以保留具备 CSS 输出方法的内容对象，不能要求所有 `value` 先变成字符串。至少用一条非聚合的 Rule 实际走通改写，以证明这不是空转阶段。
4. 输出阶段从每个 `parsedStyleNode` 取得内容文本，按其路径和 `key` 组成 CSS 声明及块，返回 `CSSString`。多个内容节点可以共用 CSS 块头，但每个内容节点都能找到对应的输出内容。CSSRoot 在完整编译成功后提交字符串。

一个只说明阶段边界的例子：

```ts
// 概念示例，不是当前类型声明或已确定的公开 API。
const styleNodes = [
  {
    conditionPath: ['.Button'],
    stateConditionPath: [hover],
    key: 'opacity',
    value: 0.7,
  },
]

const parsedStyleNodes = [
  {
    conditionPath: ['.Button', '&:hover'],
    key: 'opacity',
    value: '0.7',
  },
]

// CSSString 中有与该内容节点对应的声明：
// .Button { &:hover { opacity: 0.7; } }
```

State Condition 的身份来自 `stateCondition(...)` 的构造与登记，不由 `:hover`、`:is()` 等文本自动推断。即使最后的 CSS 路径文本相同，普通 Condition 与 State Condition 在 `styleNodes` 中仍有不同作用：前者参与地址，后者只限制当前受体何时生效。

## 实施顺序与验收

1. **盘点能力与调用方。** 从现役业务用法与浏览器结果列出需要迁移的能力，区分产品能力与旧 API、旧报错时机、旧文件名。核对规则登记、Cluster、Value／Variable、依赖、CSSRoot 与 Button 的使用场景；旧测试快照本身不构成新契约。
2. **收口唯一节点链。** 来源规则和依赖规则都经过可改写 `styleNodes`；改写后的地址、状态、目标和内容决定求值及纯内容 `parsedStyleNodes`，再输出 CSS。消除仅为旧写法存在的附带字段、转发层和并行通路；旧载体的现役责任先找到接手者再退出。
3. **迁移现役使用者。** 如输入写法变化，更新实际调用方和测试。对每项现役能力，用选定写法下的正式入口用例证明仍可表达并运行；不能以旧输入还能解析作为通过条件。至少一条非聚合 Rule 必须真实改写节点。
4. **完成可观察验收。** 检查节点顺序、普通地址与状态分离、改写字段生效、特殊节点退出、依赖同链和 parsed 内容输出；在浏览器中核对状态实时切换、普通同名声明层叠、Variable 自动定义、Button 的现役使用场景，以及 CSSRoot 成功提交和失败不提交部分结果。

若某项现役能力只能经旧语法或平行编译路径工作，判为未完成；若为了删旧路径使该能力消失，也判为未完成。相同属性的独立普通声明不得在本轮自动聚合。AST 初版已有的测试通过只证明当时版本，本次新裁决尚未完成代码验收。

## 实施前与实施中复核

- 先用正式业务规则输入检查改写协议能实际编辑节点；按需依赖、Variable 定义或嵌套 Rules 不得走直接拼串的平行入口。
- 核对 Value、Variable 与 CSS 函数在改写前后的求值时机；可输出内容对象不能因过早字符串化而失去节点改写所需的信息。循环检测与失败不提交部分结果的能力仍须成立，无须复制旧报错时机和文字。
- 若真实调用链证明某个目标文件不能清楚拥有树中责任，先指出该证据并重新审查职责；不能通过改写本 Plan 的验收把未接通的阶段说成完成。

## 分工与 Plan 落地

本 Plan 从 [UIKit Agent 入口](../../AGENTS.md) 进入 AI Rules；施工按 Bcoin 的 [Plan 落地契约](../../../bcoin-machine-learning/docs/how-to-apply-plan.md)记录事实、处理偏差并逐项验收，岗位按其 [Agent 自动分工与模型配置](../../../bcoin-machine-learning/docs/rules/Agent自动分工与模型配置.md)组织。建议一支执行负责人施工队负责完整代码迁移与集成；独立审查 Agent 从用户原话反查 Plan、实现和现役能力，Watchdog 只读检查边界与旧路径退出；技术总监处理重大裁决和最终验收。审查和监察不参与被审查代码编写。

**本次 Plan 审查结论：** 用户新增裁决改变的是保留边界：保留现役能力，不以旧写法兼容为验收。AST 与属性值聚合仍是两项独立需求。反向验收须同时拒绝“拿旧 API 测试限制新设计”和“借清理之名删除现役能力”。新业务输入的具体形状可在上述能力和阶段边界内由施工选择。独立来源审查已针对旧 API 签名、改写参数、目标文件动作和测试落点提出反例；四项修正经定向复核通过。本轮未施工代码，故实施与新裁决的代码验收仍为 TODO。
