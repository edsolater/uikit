# Style System 属性值贡献与聚合 Plan

> 状态：TODO，后续独立需求；尚未选择聚合协议或进入实现。前置任务是完成 [Style System 语义节点与条件地址 Plan](StyleSystem语义节点与条件地址.md) 的 AST 编译链。本 Plan 不参与该前置任务的验收。

## 要解决的问题

多个彼此独立的声明可以向同一个 CSS property 贡献值的片段。系统收集当前有效的贡献，按该 property 的语义组合成最终值；每个声明只知道自己的片段，不读取或修改所谓“当前完整值”。例如三个独立的阴影贡献 `A`、`B`、`C` 同时有效时，最终可以得到 `box-shadow: A, B, C;`。

普通声明继续使用 CSS 覆盖与层叠。**同一个 property 下有多个节点，并不自动意味着聚合。**未来必须明确区分普通声明与参与聚合的声明，且不能让这个区别由逗号文本或 `key` 相同这一事实猜测出来。

本 Plan 讨论的是 **CSS Property Value** 的组合，与现有 Variable Cluster 聚合多个 Variable 成员是不同需求。

## 语义边界

- 每个贡献独立携带内容与 Condition；Condition 决定它当前是否有效，由浏览器实时判断。Compiler 不预先判定状态冲突，也不枚举 hover、focus 等所有组合。
- 聚合保留确定的贡献顺序；不默认交换或去重。`box-shadow: A, B` 与 `B, A`、`A, A` 与 `A` 不能无依据地视为等价。
- 聚合操作由目标 property 的实际语义决定。`box-shadow` 与 `background-image` 都能写逗号列表，却不能据此断定它们的完整组合规则相同。`text-shadow`、`mask-*`、`animation`、`transition` 等只作为后续研究对象，未自动进入首轮实现范围。
- 数值相对修改和有序 transformation 与本需求同属“独立声明片段”的方向，但不能因此把加法、列表拼接和函数流水线强行放进一种实现。

一个待实现的行为例子：

```text
普通状态           → A
hover 时增加       → B
focus 时增加       → C

普通状态           → A
hover              → A, B
focus              → A, C
hover 与 focus     → A, B, C
```

这里的 `A`、`B`、`C` 是独立内容，不代表已选 API。顺序由将来确定的聚合规则保留，不假定贡献是集合。

## 与 AST Plan 的交接

AST Plan 先独立交付 `Rules → styleNodes → parsedStyleNodes → CSSString`：`styleNodes` 可由 Rule 改写，普通地址与 `stateConditionPath` 分开；`parsedStyleNodes` 只含可输出内容，状态路径已并入输出路径。本 Plan **在该边界建成并验收后**，再讨论某种特殊规则如何识别贡献、改写节点，并交付合法的 parsed 内容节点。最终 CSS 输出阶段仍只组装内容，不承担聚合决策。

因此，本 Plan 不能倒过来要求 AST Plan 先实现 contribution API、slot、版本链、`@function`、`inherit()` 或 JS。AST 的正确性由其自身的节点、改写与现役行为验收判断；本 Plan 的通过与否不能追认或否决尚未完成的 AST 实现。

## 现有结构与候选改动位置

当前仓库尚未实现 AST 阶段。以下现状是已核对的当前载体；正式实施本 Plan 前，须按 AST Plan 的实际交付重新读取结构。

```text
src/style-system/【目录】：当前 Style System 源码。
    rule.ts【文件】：登记有序 Rules，当前未区分普通声明与属性值贡献。
    css-root.ts【文件】：持有 Rules 源账本，调用 Compiler 生成 CSS 字符串。
    compiler/【目录】：当前编译实现。
        compile-css.ts【文件】：直接解析 Rules、输出 CSSRecord，再组成 CSS 字符串。
        records.ts【文件】：保存三项 CSSRecord 与保守分组逻辑。
```

下面是 **依赖 AST Plan 完成后的候选目标结构**，不是当前已存在的文件清单，也不是已裁决的施工图。动作标记以该前置 Plan 的目标结构为起点；本 Plan 开工前须据实际结果重新裁决。

```text
src/style-system/【目录】：前置任务完成后的父目录。
    rule.ts【更新，文件】：在不改变普通声明语义的前提下，承接明确的贡献输入边界。
    compiler/【目录】：前置任务完成后的父目录。
        style-nodes.ts【更新，文件】：表达本需求所需的特殊节点信息，不改变普通节点的地址与状态含义。
        compile-rules.ts【更新，文件】：在 styleNodes 到 parsedStyleNodes 的改写阶段调用 property 专属组合规则。
```

Property 专属规则由哪个文件拥有，以及它是否需要新增文件，当前没有足够依据选定；不能为填满目录树虚构名字。这是本 Plan 保持 TODO 的结构性未决项。

## 后续实施顺序与验收

1. 先取得 AST Plan 的独立验收：正式编译链真实经过可改写节点与纯内容输出阶段，普通 CSS 层叠、Value／Variable 和 CSSRoot 行为未退化。
2. 分别确定 `box-shadow` 与 `background-image` 的贡献单位、顺序、重复、空值和普通覆盖交互；从这些属性语义决定规则拥有者与输入方式，再确定目标目录结构。
3. 用真实浏览器证明所选 CSS 降低方式能在状态同时成立、单独成立和全部失效时得到合法且正确的值。Contribution Slot、Version Chain、CSS `@function`、custom property、编译期展开或 JS 都只是候选工具，不预先成为需求。
4. 再把贡献规则接到正式 Rules 与 AST 改写阶段；改写后的节点只包含可输出 CSS 内容。验证一项贡献者不必知道其他贡献者，撤销或替换一项贡献不会错误改变其他贡献。

终局验收同时包含正反例：独立贡献按目标 property 的确定顺序组合，状态由浏览器实时切换；普通同名声明仍按原层叠处理；顺序颠倒与重复贡献不被无依据地交换或去重。只生成看似正确的 CSS 字符串、只通过静态快照，不能证明浏览器中的组合语义成立。

## 未决与停止条件

- 聚合是 Property 自身的能力、Value 的能力，还是显式特殊规则的能力？如何与普通覆盖声明区分？
- 哪些 property 适合首轮自动聚合；是否存在少量可复用策略，还是必须逐 property 定义？
- Condition 进入排序与聚合时使用何种身份；多个特殊规则改写同一批节点时怎样确定先后？
- 浏览器可用的降低方式能否完整表达条件组合，尤其不能用语法上合法但改变层数或覆盖次序的占位内容冒充正确结果？

这些问题未由 AST 的完成自动回答。若所选方法需要改变 AST Plan 已冻结的节点或输出契约，先拿证据重新审查两个 Plan 的交接；不能反向修改 AST Plan 来解释聚合实现。
