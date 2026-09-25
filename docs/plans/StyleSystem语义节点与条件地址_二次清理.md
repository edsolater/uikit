# Style System 语义节点与条件地址：二次清理

> 状态：TODO，待用户确认，尚未施工。本 Plan 附属于 [AST Plan](StyleSystem语义节点与条件地址.md)；[属性值聚合](StyleSystem属性值贡献与聚合.md)是另一项需求。确认后才修改代码和 [Architecture](../../src/style-system/architecture.md)，施工按 [Plan 落地契约](../../../bcoin-machine-learning/docs/how-to-apply-plan.md)执行。

## 目标与边界

CSSRoot 保存有序 Rules。Compiler 每次从 Rules 建立新的语义节点队列，在**当下这条队列**上逐波解析，得到只含可输出内容的 `parsedStyleNodes`，最后生成 CSS string。解析对象只能通过有限的 `ASTController` 操作队列，不直接拿到整条队列。后一项解析可以看见前一项已经造成的变化；不另存一棵供每项读取的原始树。

对象可以有 `parse(astController)` 方法，也可以没有。**解析能力属于对象自身，不按 Value、Variable 类型各设一个 Compiler 解析器。** Value 本身没有 `parse`；Variable 可以有 `parse`，用控制器向根部插入 `@property` 等节点，再返回引用它的 Value。复合 Content 把所包含的对象连接起来：Value 指向自己的内容，CSS 函数指向参与组合的内容，解析返回值接回原位置。Compiler 沿这些连接游走；纯值没有子对象，检查完自身就能转到下一条 Rule。

到达一个声明的 Content 位置时，解析波要检查该位置可到达的全部对象。只有它们都已解析完成，或本来就无需解析，这个位置才能成为 parsed 内容；外层对象没有 `parse`，并不证明其内部已经完成。对象之间怎样保存连接、怎样遍历和缓存，是 Compiler 与内容对象的实现责任，不要求业务定义者手工管理链。

`parseWaveIndex` 是对象可选的**最早解析波号**：省略表示第 0 波；设为 1 表示从第 1 波起可以解析，第 2 波才遇见它也照样解析。Root 波扫描节点队列；走到一个 Content 位置，次波沿这个位置的内容连接检查当前可解析对象。两者使用同一个波号：若某对象要等更高波号，该位置保持待解析，后续 Root 波再进入；当前能解析的对象处理完，就继续下一条 Rule。控制器插入的新规则进入后续 Root 波。循环产生规则必须终止或明确失败。

语义节点的 `conditionPath` 由两部分组成：`targetConditionPath` 表示目标的层次地址，`stateConditionPath` 表示这个目标的状态条件。State Condition 仍是 Condition，却不改变目标身份。概念形状如下，具体 TypeScript 类型留给施工时确定：

```ts
conditionPath: {
  targetConditionPath: ['.Button'],
  stateConditionPath: [hover],
}
```

`ASTController` 至少让解析对象知道当前两段路径，并能在指定地址插入节点、按 key 查找节点。删除等操作可按真实规则需求补充；这里不预设完整方法签名，也不暴露整条队列。到 parsed 阶段，两段条件合成输出 CSS 所需的路径；parsed 节点不再保留待解析规则。Compiler 保留重复同址同 key 声明及其队列顺序，不裁决业务是否插错位置，也不代替浏览器做 CSS 层叠和合法性判断。

本次是对原 AST Plan 的**方向修正**：撤回双视图改写；撤回“统一路径抹去状态路径”的写法；撤回按 Value、Variable 分设解析器文件，以及 Variable 缺省声明专属编译阶段。保留现役能力，不保留旧 API 写法与并行编译通路；本轮不做属性值聚合。

## 调用链与例子

```text
CSSRoot 的 Rules
  → buildStyleNodes：建立有序语义节点队列
  → Rule Parser：Root 解析波扫描当下节点队列
       ├─ 到一个 Content 位置：次波沿完整内容关系查找、调用对象自己的 parse
       ├─ parse 返回的对象接入原位置，继续检查其内部内容
       └─ 控制器插入的新规则进入后续 Root 波
  → parsedStyleNodes：只有可输出内容，状态条件进入输出路径
  → toCSSString：依队列顺序写 CSS
  → CSSRoot：完整成功后提交
```

例如节点声明 `color: value(toneVariable)`。外层 Value 没有 `parse`，次波沿 `content` 找到 `toneVariable.parse(controller)`。Variable 可以在 Root 插入 `@property --tone`，并返回 `var(--tone)` 对应的 Value；返回值接回原位置，再检查其内部。整个 `color` 位置完成后，Compiler 继续下一条 Rule。若声明是 `color: 'red'`，这个位置只有一个纯值节点，检查完就继续下一条 Rule。插入的规则在后续 Root 波接受同一套解析，全部完成后才写 CSS 文本。

## 目标目录与责任

文件名指向负责的**领域**，函数名才描述动作。现有 [`compile-rules.ts`](../../src/style-system/compiler/compile-rules.ts) 混合多个环节；[`compile-value.ts`](../../src/style-system/compiler/compile-value.ts)、[`compile-variable-reference.ts`](../../src/style-system/compiler/compile-variable-reference.ts) 中的现役能力先找到接手处，再退出旧通路。目标关系如下；缩进表示归属，调用先后见上一节。

```text
src/style-system/【目录】：规则登记与样式对象。
    condition.ts【更新，文件】：表达 targetConditionPath、stateConditionPath 及合成的 conditionPath。
    rule.ts【更新，文件】：登记 Rules，并接纳带 parse 方法的规则对象。
    value.ts【更新，文件】：Value 自身无需 parse；保留指向内部内容的连接供次波遍历。
    variable.ts【更新，文件】：Variable 自己实现 parse(astController)，返回后续内容。
    compiler/【目录】：唯一的 Rules → parsedStyleNodes → CSS string 链。
        rules.ts【重命名并更新，文件】：原 compile-rules.ts；编排节点建立、解析波和输出。
            buildStyleNodes【函数】：从 Rules 建立本次语义节点队列。
        style-nodes.ts【更新，文件】：语义节点与 parsed 节点的形状和转换边界。
        rule-parser.ts【新增，文件】：调度 Root 波与 Content 次波，调用对象自己的 parse 方法。
        ast-controller.ts【新增，文件】：当前路径与对当下队列的有限操作。
        css-string.ts【新增，文件】：从 parsed 节点顺序输出 CSS string。
            toCSSString【函数】：按条件路径开闭 CSS 块。
    architecture.md【更新，文件】：代码落地后记载真实职责和调用链。
```

旧 `compile-value.ts`、`compile-variable-reference.ts`、`group-parsed-nodes-by-address.ts` 不留兼容转发；其必要的内容读取、变量状态、按需资源和输出能力必须被上述链路接管。`compileRules()` 仍是 Compiler 总入口，CSSRoot 仍只在完整成功后挂载。先核对每个旧文件实际职责，再迁名和改造，不为凑目录树机械拆文件。

## 施工与验收

1. 建立复合路径、节点和 `ASTController`；用正式规则验证当前路径、定点插入、按 key 查找，以及后一项解析可见前一项修改。
2. 接通 Root 波与 Content 次波：共用波号，验证默认第 0 波、最早波号、纯值直接完成、复合内容遍历、等待更高波号、新规则进入后续 Root 波、返回值接回原位置与循环终止。Variable 用自己的 `parse` 在 Root 注册 `@property` 并返回内容。
3. 迁移现役 Value／Variable／Cluster、状态与局部声明、按需依赖和未使用资源不输出的能力。重复同址同 key 节点按原顺序输出，让浏览器决定结果。
4. 抽出 CSS 输出，移除旧编译通路；验证 Button、浏览器状态和层叠、CSSRoot 完整提交与失败回退。更新 Architecture 与引用，完成类型、必要测试和独立审查。

**实现约束：** 复合 Content 在构造时保留内部对象的连接；现役 CSS 函数也要能在输出字符串前让次波看见操作数。完成状态以本次编译中的 Content 位置为准：同一个对象在不同路径复用时仍分别处理，等待更高波号的对象不能提前标为完成。可以用 WeakSet 等缓存安全跳过已经完整处理的内容，但缓存不是解析正确性的前提。如何保存连接和完成状态由施工选择，无需另设 `sample` 标记或让用户决定具体容器。

本次只修订待审 Plan，不修改代码或 Architecture。实施从 [UIKit Agent 入口](../../AGENTS.md)进入 AI Rules，按 [分工规则](../../../bcoin-machine-learning/docs/rules/Agent自动分工与模型配置.md)安排执行和独立审查；用户确认本 Plan 前不施工。
