# Style System 架构

本文件说明 Style System 当前的职责与运行链。对象语义和组件样式书写方式见 [设计](doc/样式系统对象与行为.md)，命名见 [命名](doc/样式系统命名.md)，可证伪的行为边界见 [__spec.md](doc/behaviors/__spec.md)。

## 从定义到浏览器

```text
Condition + Declaration(声明目标, Content) → Rules → CSSRoot
Rules → rules-to-style-nodes.ts → JSSStyleNode[]
JSSStyleNode[] → style-nodes-to-content-nodes.ts → JSSContentNode[]
JSSContentNode[] → content-nodes-to-css-string.ts → CSS string → 浏览器
```

Pieces 是可复用碎片的统称，不是 Rules 中的节点或编译阶段。Rules 包含 Condition 与 Declaration；Declaration 将声明目标和 Content 配对。`pieces/contents/` 对应内容这一侧：Value 与 Variable 在组合时统称 Atom，表示可作为一块使用的最小内容单元，不增加类型层；对象仍遵守 JSSContent 约定。Combiners 与 Atom Creators 提供构造内容的方式。

`rule()`／`rules()` 登记源 Rules；`CSSRoot` 每次编译从源账本快照构造 `JSSStyleNode` 队列。Atom、Combiner 和 Atom Creator 的产物可进入内容位置。编译器按队列顺序遍历 Key 与 Content，只调用节点按需提供的 `onActive`、`compile` 和子内容链接，不识别具体业务对象。`onActive` 在内容被启用时通知并可返回按需 Rules；只有 `onActive` 的内容可以产生依赖而不输出当前声明。`compile(astController)` 在编译波中查询、插入、替换或删除当前队列节点，也可返回下一层内容。编译器沿 `dependencies` 访问子内容，整条链完成后才产生 `JSSContentNode`；插入节点从下一波开始编译。队列稳定时，Compiler 按最终 Target、State 与属性名收集同址重复内容；默认生成逗号数组 Value，或调用 Key 的 `join`。每项 Value 保留原内容并从自身已编译结果惰性读取，结果放在组内最后一项的位置并继续走编译波。原输入保留为依赖来源，输出只保留最新组合结果。隐藏的旧结果仍是存活来源，其按需产物不会因结果隐藏而自动撤销；后续贡献可能依赖该产物，来源关系仍由 ASTSession 管理。

完整的 `conditionPath` 保存 `targetConditionPath`、规范化 `stateConditionPath` 与未排序的 `semanticPath`。语义归属沿原始父链判断，CSS 输出仍按状态中央顺序。编译器通过有限的 [ASTController](compiler/ast-controller.ts) 取得当前位置与队列操作，不能直接操作整条队列。编译完成时，状态路径并入 CSS 输出地址；`JSSContentNode` 保留已完成的内容对象及子内容编译结果。最后一段才调用 `toCSSString` 并写出 CSS，不按 Variable 或依赖来源重排。循环引用、超出嵌套上限或无进展的编译会明确失败。

`Variable.declare(value?)` 与 `Variable.modify(change)` 返回二元 Declaration。`variable.ts` 保留创建、引用、状态与注册入口；`variable-modification.ts` 负责局部声明的基础值、修改步骤及撤销重连，两者共用一份编译会话状态。AST 提供最近语义父节点与邻近位置查询，修改按实际位置连接相邻步骤；编号只保证名称唯一。晚到定义触发对应修改重绑，其他引用仍由普通 `compile/onActive` 推进。没有独立 Rewriter 协议、操作转发或整组表达式缓存。

`Value` 包装内容但不自行选择 Variable 状态。`Variable.compile()` 在普通消费时读取同一 Variable 对象的 `config`，插入 `@property` 和自身状态定义，并返回带 CSS `var()` 回退值的 Value；Variable 生成状态声明时把选中的状态随内容节点交给编译器；编译器从内容入口沿返回值和 `dependencies` 传递该状态。嵌套来源 Variable 按同名状态读取内容，缺失则读取默认内容；来源其他状态不会进入该声明。普通 Rule 消费仍保留 CSS 引用。Variable 的嵌套引用通过 Content 链编译。根声明由需要它的具体 Atom 通过普通 Condition Rule 按需提供。可组合定义的状态先写入内部 base，再应用修改；`registration` 的类型约束同步到内部步骤。`VariableCluster` 代理默认 Variable 的对象属性和编译接口，选择和双方同名成员配对由 Cluster 自身负责。`clusterFrom` 按同名来源成员建立普通 Variable，保留来源状态引用并应用本组覆盖；未配置成员复用原对象。Combiner 与 Atom Creator 构造的内容通过 `dependencies` 暴露操作数，在最终输出时生成 CSS 文本。

[rules-to-style-nodes.ts](compiler/rules-to-style-nodes.ts) 从 Rules 建立样式节点队列；[style-nodes-to-content-nodes.ts](compiler/style-nodes-to-content-nodes.ts) 逐波编译、处理按需 Rules 和同址组合；[content-nodes-to-css-string.ts](compiler/content-nodes-to-css-string.ts) 按内容节点顺序输出 CSS。按需 Rules 回到第一步建立节点，再进入下一编译波。依赖按完整地址替换，未被消费的 Value、Variable、函数、动画和自定义资源不进入 CSS。同址同名 Key 默认组合，单条声明仍直接输出。

`compileCSS()` 只返回 CSS 字符串。`cssRoot.mount()` 保留宿主已有前缀，结果未变化时不重写，编译失败时保留此前提交。测试登记通过句柄清理。

## 文件职责

| 位置 | 职责 |
| --- | --- |
| condition.ts | Condition、完整 `conditionPath`、目标与状态子路径，以及 CSS 输出地址与地址身份 |
| pieces/state-conditions.ts | 主体状态名称、条件登记与中央顺序 |
| key.ts | JSSKey 的创建、可选聚合协议、声明目标识别与名称解析 |
| declaration.ts | Key／Variable 与内容的二元声明 |
| rule.ts | 声明组合、Rules 登记与句柄 |
| content.ts | 内容对象共同的可选行为、子内容读取与构造方法 |
| value.ts | 稳定 Value 的内容包装与输入类型 |
| variable.ts | Variable 创建、引用、状态与注册，以及 declare/modify 调用入口 |
| variable-modification.ts | 局部声明基础值、修改步骤连接、重绑与撤销 |
| variable-cluster.ts | Variable 成员选择、default 代理、同名声明配对及成员继承创建 |
| css-root.ts | 源账本、三步编译调用和宿主提交 |
| compiler/rules-to-style-nodes.ts | 将 Rules 展开为有序 JSSStyleNode 队列 |
| compiler/style-nodes-to-content-nodes.ts | 推进 compile/onActive 与按需节点，在稳定队列中调用同址 Key 聚合，失效后重访，无进展时诊断，生成 JSSContentNode 队列 |
| compiler/ast-controller.ts | 节点定位、插入、内部位置调整、撤销、重访与来源所有权 |
| compiler/content-nodes-to-css-string.ts | 惰性读取已编译内容，并按 JSSContentNode 队列顺序输出 CSS 字符串 |
| pieces/keys | 可复用的 JSSKey 定义及其名称登记 |
| pieces/conditions | 可复用的普通 Condition；条件协议由 condition.ts 定义 |
| pieces/contents/atoms | 按用途组织的现成 Value 与 Variable |
| pieces/contents/combiners | 混色、计算等内容组合操作 |
| pieces/contents/atom-creators | 按结构生成阴影、动画等内容 |
| pieces/roles | 供组件在自身选择器中赋值的共享角色 |
| pieces/mixins | 把完整效果转换成声明组合 |
| test | 验证 Style System 多文件协作与完整业务流程 |
| doc | 面向使用和设计阅读的对象契约 |

公共 `index` 公开 Variable 创建、Cluster 聚合与成员继承、声明、编译和 Mixin。Key 和其他碎片从负责文件导入；Variable 类型直接包含创建配置 `config`，自动状态声明 Key 位于 `config.definitionKey`。

## Button 接入

Style System 是抽象层，包含可复用碎片和面向组件的通用定义。是否通用取决于描述目标与领域，不取决于当前消费者数量。

`Button.style.ts` 拥有 Button 的选择器、variant、tone、size、status 与组件差异。语义配色由 `accentColor`、`dangerColor`、`toneColor` 等 Cluster 提供；Button 通过声明选择整组成员，不读取 Cluster 内部定义。

当前 Button 仍存在 `bare + tone`、`solid + tone` 的显式交集配方。这些定义已用 `TODO` 标出，是待删除的不可组合临时方案，不是 Style System 的组合模型。

Button 静态导入自身样式；Example、Storybook 和缩略图入口在 render 前统一挂载。懒加载样式仍由应用样式清单负责提前登记。

## 验证

同目录测试只验证同名源码文件自身的业务契约，文件名以对应源码名加 `.test.ts` 或 `.browser.test.ts` 构成。跨文件协作及 Style System 整体流程的测试放在 `test/`，用中文描述验证目的并保留英文测试后缀；归属仍由断言对象决定。

单元测试覆盖 Value、Variable、Cluster、Controller/波次、声明、依赖、循环和顺序。浏览器测试验证状态优先级、Cluster 多成员继承、局部覆盖、CSS 函数局部定义，以及 Button 的现有配方和交互。测试通过后仍需检查归属、阅读顺序与不必要机制。
