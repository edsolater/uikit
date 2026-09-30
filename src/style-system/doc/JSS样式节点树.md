# Style System 语义节点与 Content 编译链

现役链路为 `rule()`／`rules()` 登记 Rules → 有序 `JSSStyleNode` 队列 → 按编译波访问 Key 与 Content → 队列稳定后合并同址同名声明 → 只含完成内容的 `JSSContentNode` 队列 → CSS 字符串。目标地址和受体状态在待编译节点中分别保存；编译完成后合并为输出地址。重复声明的结果落在同组最后声明的位置。

## 节点队列

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

每个 `JSSStyleNode` 的 Key 和 Content 都在其自身位置编译。Content 可以是字面值或 `JSSContent`；Value 与 Variable 在组合时统称 Atom，Atom 不增加对象类型。Combiner 和 Atom Creator 也可构造作为一块使用的内容。Compiler 只调用对象按需提供的 `onActive`、`onCompile(context, ast)`、`dependencies` 和 `toCSSString`，不按碎片分类分支处理。只有 `onActive` 的内容可以提供依赖而不输出当前声明；对象也可插入后续节点或返回新内容。纯字符串、数字与已完成的对象链直接结束该位置。只有链上所有对象都已编译或无需编译后，节点才成为 `JSSContentNode`。

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
  return undefined
}
```

`context.node` 是可改写节点引用，`conditionPath`、`key`、`content` 是角色开始时的输入快照；改写 `node` 不改变这些快照。`role` 区分声明目标与声明内容。仅内容角色携带 `readState`，返回内容及 `dependencies` 沿用同一上下文。`context.session` 是本次编译的不透明稳定身份，供消费者保存私有状态。Controller 不携带以上字段，也不携带当前编译波。

正常队列操作只使用以下入口：

| 目的 | 调用 |
| --- | --- |
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

节点的内容身份未变但编译前提改变时，递增 `node.compileRevision` 使旧编译及同址聚合结果失效。无法继续时写入 `node.deferredReason`，或使用快捷方法 `defer(node, message)`；每次尝试前清除旧原因，后续波重试，队列无进展时报告原因。内容对象的 `compileWaveIndex` 指定最早编译波；当前波次由编译器内部掌握，不进入上下文或 Controller。激活只由编译器内部处理，引用环和超过上限的内容链会明确失败。

消费者用不透明的 `context.session` 对象作为私有 `WeakMap` 的键，保存仅属于本次编译的状态；Controller 不提供通用状态存储或共享生成回调。

## Content 链与 Variable

`Value` 包装 Content，默认把数组递归输出为逗号列表，也可用 `toCSSString` 改写输出，不改变 Variable 身份。`valueList` 与 `valueSequence` 分别装配默认逗号和空格列表；Value 的 `dependencies` 显露嵌套数组中的待编译内容对象。Combiner 和 Atom Creator 构造的内容对象同样在 `dependencies` 中显露原操作数，让次波编译嵌套引用。编译器按当前 Content 位置记录 `onCompile` 返回对象；最终输出读取原操作数时会取得对应的编译结果。

`Variable.onCompile(context, ast)` 在普通消费时插入 `@property` 注册及 Variable 自身状态定义，再返回可输出的 CSS `var()` Value。Variable 生成状态内容节点时直接携带选中的状态，编译器从该节点内容入口沿返回值与 `dependencies` 传递；嵌套 Variable 按同名状态读取内容，缺失时取默认内容，无 states 的来源也取默认内容，不把来源其他状态加入当前 Variable。普通 Rule 消费仍保留 CSS 引用。状态定义由 Variable 自己确定地址与插入顺序，不生成状态交集。自动状态定义按即将插入的目标地址查找最近的同一 Variable 局部声明，使用其基础值 Key；没有局部声明时使用 `config.definitionKey`。自动产物以 Variable 对象作为不透明 `productTag`，局部声明通过通用产物查询和语义父链清理归属自身的旧产物；`productTag` 只供查询，不改变节点来源所有权或资源替换。Compiler 不按 Variable 类型分支。Cluster 的成组声明由 Cluster 自己配对并插入普通队列节点；普通引用向默认成员转交完整上下文，与默认 Variable 一样按同名状态读取内容，缺失时读取默认值；按需依赖使用同一编译和输出链。

## 输出阶段

`JSSContentNode` 是编译完成的声明，保留输出地址、JSSKey、内容对象及子内容编译结果。其 `conditionPath` 已合并 target/state，描述最终 CSS 嵌套位置。同址同名至少两项在稳定队列中默认形成逗号数组 Value，或调用组内唯一显式 Key `join`；若结果带待编译内容，继续进入编译波。输出器读取最终队列内容对象的 `toCSSString`，打开和关闭条件块并返回 CSS 字符串，不再编译或聚合。

相关实现：[Rule](../rule.ts)、[JSSKey](../key.ts)、[JSSContent](../content.ts)、[Value](../value.ts)、[Variable](../variable.ts)、[Rules 到样式节点](../compiler/rules-to-style-nodes.ts)、[样式节点到内容节点及 ASTController](../compiler/style-nodes-to-content-nodes.ts)、[内容节点到 CSS 字符串](../compiler/content-nodes-to-css-string.ts) 与 [CSSRoot](../css-root.ts)。正式入口覆盖见 [内容编译波测试](../test/内容编译波遍历及插入节点.test.ts) 和 [样式登记与依赖测试](../test/样式登记经依赖解析生成CSS.test.ts)。

`remove(node, { from: 'output' })` 只移除输出位置，保留其来源和产物；`remove(node)` 撤销节点，并删除失去全部来源的后继。待入队依赖只接受仍存活的来源，共享资源不会因一个消费者消失而被撤销。节点插入和移动统一由 ASTSession 执行。

Variable 的 declare/modify 内容和其他内容一样直接调用 onCompile；AST 只按通用字段查询队列；Variable 自行判断语义归属与修改步骤，不向 AST 增加领域查询。Compiler 不设专门的改写器阶段。

Variable 的注册配方使用 `resourceAddress` 查找同址资源、`productTag` 区分对象身份，并组合 `search`、`depend`、`remove`、`insert`。同一对象的活跃消费者复用现存产物；不同对象首次消费替换同址注册。旧对象在本次激活期内再次消费不会反过来覆盖新注册；其全部消费者撤销后可重新激活。该激活期由 Variable 自己保存，不由 Controller 管理。
