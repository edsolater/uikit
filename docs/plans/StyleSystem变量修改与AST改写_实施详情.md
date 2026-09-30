# Variable 局部定义与修改实施详情

对应 [Plan](StyleSystem变量修改与AST改写.md)。稳定目的以 [Variable](../../src/style-system/doc/变量定义与消费.md) 为准。本文记录当前实施结构、修正原因和证据，不把实现步骤当作 Variable 的永久能力定义。

## 这次实际删掉了什么

原先 `variableDeclare/variableModify → operation → variableRewriter → updateDefinition` 的路径由 Variable 的 `declare/modify → parse` 接管。旧的 rewriter.ts、variable-modification.ts 和公共 Rewriter 类型已删除，Compiler 不再提供 rewrite 转发方法。当前 `variable-modification.ts` 只承接局部声明与修改链的编译实现，不恢复旧 Rewriter 协议。

原来的 DefinitionGroup、generated、expressions 以及每次遍历整组重建的逻辑删除。现在每个修改只展开自己的输入引用、默认传递与条件赋值。AST 按实际位置提供相邻节点；Variable 重连相邻引用，既有 apply 不因晚到前插重新执行。名称中的编号只负责唯一性，修改顺序来自声明的 AST 位置。

每个步骤增加一条输入引用声明，这是不重新执行既有 apply 仍能局部重连的实际成本。计数器不能替代依赖关系，因此保留相邻连接；没有借机恢复整组表达式缓存。共享 ID 的多个条件各自拥有赋值，首个成员撤销后按剩余成员位置重新连接。

## 文件责任

| 文件 | 当前责任和变化 |
| --- | --- |
| [variable.ts](../../src/style-system/variable.ts) | 统一 Variable 创建、引用、declare/modify 调用入口、自身状态与注册；普通消费和自动状态声明留在此处 |
| [variable-modification.ts](../../src/style-system/variable-modification.ts) | 局部声明的基础值、修改步骤、相邻连接、重绑和撤销；声明与修改共用一份编译会话状态 |
| [ast-controller.ts](../../src/style-system/compiler/ast-controller.ts) | 通用父节点/邻近节点定位、插入、移动、共享来源、撤销和重访；不包含修改专属概念 |
| [condition.ts](../../src/style-system/condition.ts) | 提供原始语义路径比较；状态中央排序仅用于输出 |
| [节点内容编译入口](../../src/style-system/compiler/style-nodes-to-content-nodes/node-compilation.ts) | 保持普通待解析队列和完成判断；后续内容继续按既有生命周期处理 |
| [variable-cluster.ts](../../src/style-system/variable-cluster.ts) | 默认成员代理、同名成员配对和集合继承创建；无独立修改规则 |

Variable 保留公开入口和普通消费；局部定义、单个步骤与相邻连接由 VariableModification 共同维护，因为它们共享作用域、覆盖、源顺序和撤销事实。AST 只拥有位置和来源。Compiler 继续消费内容，不识别 Variable。

## 默认值与根规则迁移

创建首参数现命名为 `defaultValue`，公开类型改为 `VariableDefaultValue`，没有保留重复别名。普通引用用它生成 CSS fallback；`declare()` 在局部基础定义中读取它，`declare(content)` 使用显式内容；相对修改只连接局部步骤，不改写创建默认值。生产函数继续在每次实际消费时执行，不缓存一次结果。Cluster 仍代理默认成员。`registration.initialValue` 保留独立配置，未从默认值推断类型或注册值。

`VariableOptions.root` 及 `value/dark/reducedMotion` 分支已从 Variable 删除。font、space、size 的固定根值迁为首参数。motion 的根倍率、减少动效媒体规则和快速时长根值，以及 edge 的分隔线根值，由这些 Atom 在创建选项中传入通用 `onActive`，消费时返回普通 Condition Rules。edge 继续在根上读取 textColor；若只换成 fallback，局部 textColor 覆盖会改变原有分隔线求值位置，因此这里保留根声明。motion 同样保留根上求值与浏览器媒体变化。环境选择属于普通 Rule 和浏览器，不引入 Variable 专用主题字段。

## Variable 的创建配置

`variable()` 创建一个 `Variable` 对象，公开类型直接包含 `config`。它一次保存 defaultValue、已求值的 states、modification 与 registration，并以 `definitionKey` getter 按当前名称生成 Key；引用解析、`declare()` 和注册展开直接读取它。原 `VariableDefinition`、`definitions` WeakMap 和 `variableDefinition()` 查表中转已经退出；省略内容的 `declare()` 不再另捕获一份 defaultValue。

`clusterFrom()` 从来源 Cluster 的同名成员生成普通 Variable，默认值引用对应来源成员；状态名称由 Cluster 在创建时读取来源成员配置并映射到来源引用，当前成员的同名状态优先。未配置成员直接复用，新成员提供现成 Variable。Variable 内不保存继承字段，也不遍历来源状态。Cluster 的 Proxy 直接从默认成员取得对象属性与方法；成员索引仍用于同名配对。局部定义、步骤及共享 ID 属于编译会话，没有移到对象 config 上。自动状态声明按目标路径由 AST 查找最近的同一 Variable 局部定义，不建立独立路由表。

状态内容解析已按最新语义修正：Variable 只生成自己配置的状态。自身生成的状态内容节点中的有状态来源按该节点明确选中的状态取其配置内容，缺失则取默认内容；不会把来源的其他状态带入外层节点，也不会借动态 `var()` 在浏览器同时命中其他状态时偷换已选内容。即使生成节点的 CSS 地址因显式 Rule 而同时含 active、hover，surface.hover 仍读取来源 hover 内容。无状态来源在状态内容里也读取默认内容；普通 Rule 消费与 `declare/modify` 链继续用 CSS 引用按层叠求值。Variable 创建状态内容节点时直接携带已选状态，解析器从该内容入口沿返回值与 contents 传给嵌套 Variable；不再先生成节点、登记 WeakMap，再按节点身份恢复状态。AST 仍独自管理节点来源与撤销，不选择 Variable 内容。

Button 的禁用和语气交互配方、通用焦点轮廓确实需要当前位置的局部 CSS 颜色，已在配方处显式写出 `var()` 引用；焦点轮廓按 tone line、accent line、基础 token 逐层回退。Variable 原方法不为这些业务配方增加模式或覆盖策略；复杂状态覆盖与跨 Variable 切换属于后续 Variable Tools。

本轮将 `onActive` 接入 `VariableOptions`，沿用 JSSContent 的按需生命周期；它是对象自己的内容行为，不在 `config` 重复保存。`variable()` 一次建立完整对象和创建配置，不再经过单调用者的构造转发。Atom、测试与现役行为案例不再先创建 Variable 再赋值 `onActive`。回调只在编译消费时执行，可以捕获正在声明的变量或稍后声明的其他变量；仍由普通来源追踪在撤销后清除依赖。没有加入 `self` 参数、专用环境配置或运行时冻结。

## Cluster 成员继承迁移

Cluster 成员继承迁移后，Button 与 `foregroundColorInteractive` 的普通引用改用 `variable(source, options)`。`clusterFrom(sourceCluster, changes)` 只对配置过的同名成员创建新 Variable，来源状态以成员引用作为内容，当前配置覆盖同名状态；省略成员复用原对象，直接给 Variable 可替换或新增成员。`variableFrom` 从生产源码、公共出口和声明产物退出。Variable 内不再保存或遍历继承来源。多层 default／soft 成员、默认代理、未用成员不激活以及浏览器状态结果均由现役测试覆盖。

## 保留的修复与退出的过度约束

先前维护修复继续生效：注册资源共享、pending 来源撤销、defer/revisit、detach 后来源链、source 不重复消费、未用参数不激活。最新通用边界还修正了 neighbors 的无位置情况：节点已退出队列时返回无邻居，不能误用整队列末尾。

曾给 Variable 添加私有泛型标识、限制 modify 参数，已按用户裁决删除。payload 是 apply 自己解释或忽略的内容，框架不检查其是否符合参数注解，不吞掉 apply 错误。

## 验证证据

采样日期 2026-09-27，Windows，Bun 1.3.5、Vitest 4.1.10，现有配置启动 Edge/Chromium 153 无头实例。

本轮目的测试新增：两个 declare 分别提供局部基础值；晚解析的前置加法仍先于已解析乘法且两者 apply 各执行一次；删除中间步骤保持余下结果；共享 ID 首声明撤销后按剩余位置参与非交换组合。既有真实浏览器测试继续覆盖状态 13、独立组件、退出恢复、继承边界、普通赋值、先修改后定义及类型化长链。

创建期 `onActive` 调整另用目的测试确认：创建后回调未执行；按需资源中的 Variable 可惰性引用自身与稍后声明的 Variable；正式 Rule 移除后 CSS 不残留。Cluster 默认成员、环境媒体规则及注册资源继续由既有单元与浏览器案例覆盖。`declare()` 仍只展开局部声明与注册，不额外触发对象的 `onActive`。

正式证据文件：[变量修改单元流程](../../src/style-system/test/变量修改与条件组合.test.ts)、[真实浏览器流程](../../src/style-system/test/变量修改与条件组合.browser.test.ts)、[内容编译波与 AST 操作](../../src/style-system/test/内容编译波遍历及插入节点.test.ts)。下表记录 2026-09-28 状态读取简化及 Button 配方修正后的验证范围：

| 验证 | 结果 |
| --- | --- |
| bun run type-check | 通过；公开类型允许访问 config，顶层 definitionKey 仍不存在 |
| bun run test:unit | 34 文件、177 项通过，含多层同状态读取、缺失状态取默认值与普通消费 |
| bun run test:browser | 15 文件、95 项通过，含局部 CSS 引用、Button 全部视觉基线与焦点轮廓的逐层回退 |
| bun run build | 通过；产物 Variable 声明包含 config.definitionKey |
| git diff --check | 通过 |
| 独立浏览器反例 | onActive 晚到前置乘法、既有加法和后置乘法得到 8，三个 apply 各执行一次 |

当前完整文件审查：Variable 沿创建/引用/局部定义/当前修改阅读，位置和来源操作归 AST；没有隐藏整组遍历到新文件。新增的输入引用和相邻元数据对应晚到前插与撤销时保持非交换语义的必要责任，不是表达式结果缓存。

## 当前规模采样

以下是当前局部连接实现的单次同进程采样，名字为 scale，包含建节点、解析与输出；不是统计基准。该表取代旧实现的输出规模，不能混用旧的每步骤节点数。仍有 AST 位置查询，不能据此宣称编译算法线性。

| 修改数 | 无注册 ms | 内容节点 | CSS 字节 | number 注册 ms | 内容节点 | CSS 字节 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 1.19 | 2 | 22 | 0.38 | 5 | 98 |
| 20 | 1.65 | 83 | 4,011 | 0.54 | 149 | 6,259 |
| 200 | 6.99 | 803 | 40,437 | 7.77 | 1,409 | 61,506 |
| 1000 | 55.32 | 4,003 | 204,443 | 86.19 | 7,009 | 309,513 |

浏览器已确认已有 number 注册的 20、200、1000 项，length 与 color 各 200 项正确。没有类型注册时，嵌套表达式仍可能无效；syntax 为 * 不提供类型计算规范化。实现不凭 source 猜类型，也不新增业务必填类型配置。

[CSS Values 的计算规模要求](https://www.w3.org/TR/css-values-4/#calc-syntax)允许实现有表达式上限；[注册属性的计算规则](https://www.w3.org/TR/css-properties-values-api-1/)规定类型化值的计算。这是浏览器边界，不是业务手工通道配额。

没有改 Button 交集配方，没有 Git 写操作。目的文档、Plan、实施详情各自保留自身职责，现役架构同步实际调用链。
