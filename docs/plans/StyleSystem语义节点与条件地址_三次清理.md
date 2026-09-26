# Style System 语义节点与条件地址：三次清理

> 状态：施工完成，独立实施审查与技术总监验收通过，待用户验收；独立来源审查于 2026-09-26 通过。它接续[二次清理 Plan](StyleSystem语义节点与条件地址_二次清理.md)，只修正 AST 编译链的职责偏离。验收点是 Compiler 不再感知 Variable。[属性值贡献与聚合](StyleSystem属性值贡献与聚合.md)仍是另一项需求。施工按 [Plan 落地契约](../../../bcoin-machine-learning/docs/how-to-apply-plan.md)记录并验收，证据见[实施详情](StyleSystem语义节点与条件地址_三次清理_实施详情.md)。

## 为什么需要第三次清理

用户原意是：Compiler 只认识通用样式内容，不认识 Variable、Value、Cluster 或 CSS 函数的身份。用户将这种内容称为 JSS Content；它是现有 CSS Content 概念未来更合适的名字，不要求本轮改名。字符串等字面内容可直接输出；对象可按需提供 `onActive`、`parse`、子内容链接和 `toCSSString`。Compiler 在 Key 与 Content 位置按这些能力运行，沿子内容链接继续解析，最后按完成后的节点队列写 CSS。Variable 只是其中一种具体对象。

二次清理完成了对象 `parse` 和解析波，但没有完成这条边界。当前 `compiler/rules.ts` 在建立节点时识别 Variable 覆盖和 Cluster，解析后又按依赖来源与 Variable 自动定义分组、排序、过滤；`compiler/rule-parser.ts` 仅在 Key 是 Variable 时启动 Key 解析；`compiler/ast-controller.ts` 提供 `insertVariableDefinition` 和 `isVariableDefinition`；两种节点类型还携带 Variable 专用元数据。这些是**已发生的结构偏离**，不能用现有行为测试通过抵消。

偏离的原因有三层：二次 Plan 只否定了“按类型分设解析器文件”和“专属编译阶段”，没有把 Compiler 对内容身份无感列为硬边界；施工为保持旧 Variable 的覆盖与顺序行为，把旧编译链的分组责任迁入新文件；来源审查、实施审查和最终验收检查了行为及新入口，却没有反查 Compiler 是否仍靠 Variable 身份作决定。本 Plan 不将这个遗漏解释成用户改变需求。

**纠正作者的猜测：**上一版 Plan 提出“把 `onActive` 的工作移入 `parse`”，这只是作者猜测的实现办法，从未是用户需求，也不能由“Compiler 对 Variable 无感”推出。该猜测已撤回。`onActive` 是 JSS Content 被启用时的生命周期通知；`parse` 在解析波中解析内容，并可通过控制器改写 AST 队列。两者目的不同，均为可选能力。Compiler 通用地调用它们，无须识别 Variable。

## 本轮目标与边界

Compiler 只拥有 Rules 到节点队列、通用内容能力的调用、解析波、有限队列控制、完成节点到 CSS 字符串这条链。它知道当前是 Key 位置还是 Content 位置，但不知道对象是 Variable、Value、Cluster 还是 CSS 函数。内容被启用时调用可选的 `onActive`，告知其生命周期状态；到达允许的解析波时调用可选的 `parse`，让它解析或改写 AST，并把返回内容接回当前位置；有子内容链接就继续访问；完成后由可选的 `toCSSString` 输出，字面内容直接输出。Key 的属性名也由通用 Key 输出能力取得，不按 Variable 身份分支。

现有 `cssContent(serializeCSS, contents)` 的第二参数提供显式子内容链接，本轮保留这项能力。`Value` 是可包装另一段内容的具体样式内容，`Variable` 是可引用、可赋值的具体样式内容。它们保留业务身份，Compiler 不依赖这些身份。现有 `cssContent`、`CSSKey`、`CSSRoot` 等名称本轮不改；待用户验收 Compiler 的 Variable 无感边界后，再讨论整套 JSS 命名。

各能力均可选：对象使用 `onActive` 无须实现 `parse`；普通字符串无须实现方法；复合对象显露子内容链接和输出方式，即使没有 `parse` 也要继续解析子内容。按需资源仍只在被实际消费时出现。普通 Condition、State Condition、解析波、重复声明的 CSS 层叠顺序、现役 Variable／Cluster 行为、Button、CSSRoot 成功提交与失败保留，都必须由新边界承接。为去除类型分支而调整旧输入写法时，无须保留旧写法；本轮不做 CSS Property Value 聚合，也不改 CSS 名称。

解析完成的队列就是输出顺序。需要优先级或替换的对象，应在自己的 `parse()` 中通过**通用**控制器把节点放在正确位置，或在进入解析前由自身生成合适的 Rule。不能在 parsed 阶段再按“Variable 自动定义”“依赖来源”等类别分组、删改或重排。输出节点只需输出地址、Key 与完成的内容；解析过程用的身份或资源地址不得成为 CSS 输出前第二套调度协议。

现有 Variable 状态覆盖数组与嵌套 Rules 都使用数组形状，才迫使 `buildStyleNodes` 看 Key 身份来消歧。本轮不保留这种输入写法：特殊声明须成为自描述的可解析对象，普通 Rules 只展开规则结构。控制器可向正在解析的对象提供当前 Key／Content 的有限视图，让对象自己处理成组声明；不能把整个队列交给它。

## 一条规则怎样走完

```text
rule() / rules() 登记源 Rules
  → buildStyleNodes：按原顺序建立语义节点队列，不识别业务对象类型
  → Rule Parser：逐波访问每个节点的 Key 与 Content，只识别通用内容能力
       ├─ 被启用且有 onActive：通知该内容；若返回按需 Rules，送入同一编译链
       ├─ 有 parse：达到最低波号时让它解析或改写 AST，返回值接回当前位置
       ├─ 有子内容链接：继续访问子对象；现有 cssContent 的 contents 即一种链接
       └─ 需要增加、替换或删除规则：内容用通用 ASTController 操作当前队列
  → 每个位置完成解析：有内容自身的 toCSSString 则输出完成的内容；字面内容直接输出
  → parsedStyleNodes：每个节点已是可输出内容，顺序已确定
  → toCSSString(parsedStyleNodes)：只按队列顺序写 CSS
  → CSSRoot：完整成功后提交
```

例如 `color: value(toneVariable)`：Parser 从外层 JSS Content 的链接到达内层对象。如果内层有 `onActive`，在它被启用时通知；如果有 `parse()`，在解析波达到要求时调用。内层对象可在 `parse()` 中登记 `@property`、插入状态定义，并返回可输出的 `var(--tone)` 内容。Parser 不知道外层叫 Value、内层叫 Variable。换成另两个实现相同能力的对象，Compiler 仍执行同一条链。

## 改前结构与目标落点

改前关键责任如下；缩进只表示载体归属，运行顺序见上节。

```text
src/style-system/【目录】：现役 Style System。
    rule.ts【文件】：登记 Rules；特殊声明展开尚未完全归还给对象。
    css-key.ts【文件】：取得 Key 名称时识别 Variable。
    valuable.ts【文件】：以 Valuable、ASTParseable 分别命名通用内容的部分能力。
    value.ts【文件】：ValueInput 并列枚举 Value、Variable、CSSFunction 等具体类型；cssContent 另有输出入口。
    variable.ts【文件】：Variable 的 parse 与定义选择。
    variable-cluster.ts【文件】：Cluster 成员配对；由 Compiler 调用专用展开函数。
    compiler/【目录】：当前编译链。
        rules.ts【文件】：构建节点、收集依赖，并在 parsed 后按来源及 Variable 定义重新编排。
        rule-parser.ts【文件】：解析波；Key 和部分内容遍历含对象类型分支。
        ast-controller.ts【文件】：队列操作混有 Variable 专用插入与身份标记。
        style-nodes.ts【文件】：语义与 parsed 节点携带 Variable／依赖来源元数据。
        css-string.ts【文件】：收到节点后按顺序输出。
```

目标结构只列决定本轮方向的载体；施工中发现的机械调用方进入实施详情。

```text
src/style-system/【目录】：拥有各样式对象、规则登记和编译入口；本轮不做 CSS → JSS 命名迁移。
    rule.ts【更新，文件】：登记时保留有序普通 Rule；特殊声明使用自描述的可解析内容，不按 Key 身份解释数组。
    css-key.ts【更新，文件】：保留现名，由 Key 自身提供可输出名称；名称读取不识别 Variable 类型。
    css-root.ts【文件】：保留现名、源账本与挂载行为。
    valuable.ts【更新，文件】：沿用现名，承接 Compiler 所需的通用 onActive、parse 与内容链接能力；不为命名迁移删除文件。
    value.ts【更新，文件】：Value 显露其包裹内容；保留 cssContent 构造器及显式 contents，接入通用内容能力。
    variable.ts【更新，文件】：Variable 自己处理 Key／Content 消费、注册、根值、状态定义和输出名称。
    variable-cluster.ts【更新，文件】：Cluster 自己处理成组声明及成员配对，不交给 Compiler 类型分支。
    materials/valuable-tools/【目录】：现役按需样式材料。
        animation.ts【文件】：用通用 onActive 按需提供帧定义；本轮不因改名而修改。
        functions/【目录】：CSS 函数材料。
            custom.ts【文件】：用通用 onActive 按需提供函数定义；本轮不因改名而修改。
    compiler/【目录】：只拥有通用 Rules → parsedStyleNodes → CSS string 链。
        rules.ts【更新，文件】：建队列、按内容的 onActive 收集按需 Rules 并编排解析与输出；删除按对象类别重组 parsed 节点。
        rule-parser.ts【更新，文件】：Key／Content 共用可选 onActive、parse、子内容链接与输出能力；不识别 Variable、Value、Cluster 或 CSS 函数类型。
        ast-controller.ts【更新，文件】：只提供按地址查找及按位置插入、替换、删除等通用队列操作。
        style-nodes.ts【更新，文件】：节点内容使用通用内容协议；去掉 Variable 专用和 parsed 后调度字段，保留解析所需通用节点身份。
        css-string.ts【文件】：只消费最终 parsed 队列；若无需改动就保持原状。
    architecture.md【更新，文件】：代码验收后记录真实责任和调用链。
    doc/【目录】：现役对象说明。
        JSS样式节点树.md【更新，文件】：代码验收后说明类型无感的解析链和直接输出边界。
    test/【目录】：正式入口的流程测试。
        内容解析波遍历及插入节点.test.ts【更新，文件】：以不同类型的对象验证同一解析和队列控制协议。
        样式登记经依赖解析生成CSS.test.ts【更新，文件】：验证按需资源与声明顺序在新链路中生效。
```

`variable.ts` 可以使用通用控制器决定插入位置与资源替换；控制器不能为它新增专名方法或专名标记。Cluster 的成组声明须由对象或规则登记边界转成同一套可解析节点；任意 JSS Content 的 `onActive` 返回按需 Rules 时，由 Compiler 通用地送入这条链。不得只把 `isVariable` 分支挪到另一个 Compiler 辅助函数。具体方法签名由施工在此边界内确定，不另开 Variable 编译通路。

## 实施顺序与验收

1. 在现有文件内确定 Compiler 使用的通用内容能力、Key 输出、子内容链接与控制器的最小协议；保留现有 CSS 名称，字面内容直接输出。用两种不同的自定义对象证明 Compiler 只依能力运行。核对现役 `rule()`／`rules()`、Cluster 与按需资源的输入，不能先删除分支再补业务例外。
2. 把 Variable 注册、自动状态定义、显式声明关系及 Cluster 配对移回对象自身；动画帧、CSS 函数等按需规则继续由各自内容的 `onActive` 提供。所有新规则都进入当前语义队列的后续解析波，保留未使用资源不输出、同名资源替换和循环终止。
3. 去掉 Compiler 中的 Variable／Cluster／Value／CSSFunction 类型分支及专用控制器方法，以通用内容能力接管其必要职责；让插入和替换在 parsed 前确定最终节点顺序。删除 parsed 后的来源分组、Variable 排序与显式覆盖过滤；`compiler/css-string.ts` 直接消费最终队列。
4. 从 `compileCSS()` 和真实 Button 消费者验证类型、单元及浏览器行为；更新 Architecture 与现役 Guide 的实现说明。另由未参与施工的审查者从用户原话反查**结构边界**和行为，不以测试总数或搜不到某个名称代替职责审查。

验收必须能同时证明：

- Compiler 及其内部辅助只按通用内容能力和节点位置选择路径，不根据 Variable／Value／Cluster 等具体身份选择路径；验收不以 CSS → JSS 改名为条件。
- 只有 `onActive` 的对象无须补造 `parse` 就能按需提供 Rules；有子内容链接的对象能让内层 `parse` 生效；字面内容与有 `toCSSString` 的对象都能输出。
- 自定义解析对象在 Key 或 Content 位置能完成与 Variable 同形的插入／替换，无须给 Compiler 加分支。
- parsed 节点不带供末尾分组的来源标记，输出顺序与完成队列一致；现役 Variable、Cluster、状态、局部赋值、按需依赖、Button 和 CSSRoot 行为仍通过正式入口。

若只能通过恢复专用标记或 parsed 后重排才能保留行为，停止并回到对象插入顺序及通用控制器协议查因，不能修改本 Plan 降低边界。

## 审查与未决

本次作者反向审查：最新裁决把验收点限定为 Compiler 不再感知 Variable，JSS 命名推迟到用户验收以后。上一版把 `jss-content.ts`、`jssContent()` 和旧类型删除列为本轮任务，是作者把未来命名提前并入施工，现已撤回。`onActive` 的生命周期通知与 `parse` 的 AST 解析分别保留；没有把 Variable 身份或属性值聚合带回 Compiler。独立来源审查于 2026-09-26 对照用户原话、现役行为和本 Plan 后通过；审查曾质疑 `onActive` 返回按需 Rules，复核确认用户未禁止其现役返回协议，且它不直接持控制器改写 AST。

对象输出时如何读取已经解析的子内容，以及 Key 如何提供属性名，具体方法签名留给施工确定；不得因此给 Compiler 增加 Value／Variable 分支。

本轮已按 [UIKit Agent 入口](../../AGENTS.md)、[Plan 撰写契约](../../../bcoin-machine-learning/docs/how-to-write-plan.md)、[分工规则](../../../bcoin-machine-learning/docs/rules/Agent自动分工与模型配置.md#低配版)及 [Plan 落地契约](../../../bcoin-machine-learning/docs/how-to-apply-plan.md)完成施工前来源审查并取得实施授权。实际差异、测试和独立实施审查写入同名实施详情；Plan 不因施工便利回改目标或验收。
