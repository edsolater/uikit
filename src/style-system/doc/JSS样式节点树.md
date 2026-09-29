# Style System 语义节点与 Content 解析链

现役链路为 `rule()`／`rules()` 登记 Rules → 有序 `JSSStyleNode` 队列 → 按解析波访问 Key 与 Content → 队列稳定后合并同址同名声明 → 只含完成内容的 `JSSContentNode` 队列 → CSS 字符串。目标地址和受体状态在待解析节点中分别保存；解析完成后合并为输出地址。重复声明的结果落在同组最后声明的位置。

## 节点队列

```ts
interface JSSStyleNode {
  conditionPath: {
    targetConditionPath: Condition[]
    stateConditionPath: StateCondition[]
  }
  key: JSSKey | undefined
  content: unknown
  resourceAddress?: string
  productTag?: object
}
```

队列位置决定 Rule 声明顺序。`targetConditionPath` 表示 `.button`、`@media` 等普通条件地址；`stateConditionPath` 使用已登记的状态身份表示受体状态，例如 `hover`。解析器只把值都带入完整身份，不从 CSS 字符串推断状态。

每个 `JSSStyleNode` 的 Key 和 Content 都在其自身位置解析。Content 可以是字面值或 `JSSContent`；Value 与 Variable 在组合时统称 Atom，Atom 不增加对象类型。Combiner 和 Atom Creator 也可构造作为一块使用的内容。Compiler 只调用对象按需提供的 `onActive`、`parse(astController)`、`contents` 和 `toCSSString`，不按碎片分类分支处理。只有 `onActive` 的内容可以提供依赖而不输出当前声明；对象也可插入后续节点或返回新内容。纯字符串、数字与已完成的对象链直接结束该位置。只有链上所有对象都已解析或无需解析后，节点才成为 `JSSContentNode`。

```text
Rules → JSSStyleNode[] → 逐波解析并改写当前队列 → JSSContentNode[] → CSS string
```

`ASTController` 暴露当前 `parseWaveIndex`、复合地址、Key、Content 和位置 `role`，以及有限的 `activate`、`withClaim`、`findByKey`、`findParent`、`neighbors`、`productsByTag`、`insert`、`detach`、`removeNode`、`replaceResource`、`insertResource` 操作。`findParent` 可按指定目标 `ConditionPath` 查找最近的语义父节点；省略时使用当前位置。解析对象只能通过 Controller 读写节点队列。较晚的 `parseWaveIndex` 会让该对象等待后续解析波；返回值接回当前位置继续解析。引用环和超过上限的内容链会明确失败。资源操作用于按地址替换并登记成组资源，例如 Variable 的 `@property` 描述。

## Content 链与 Variable

`Value` 包装 Content，默认把数组递归输出为逗号列表，也可用 `toCSSString` 改写输出，不改变 Variable 身份。`valueList` 与 `valueSequence` 分别装配默认逗号和空格列表；Value 的 `contents` 显露嵌套数组中的待解析内容对象。Combiner 和 Atom Creator 构造的内容对象同样在 `contents` 中显露原操作数，让次波解析嵌套引用。解析器按当前 Content 位置记录 `parse` 返回对象；最终输出读取原操作数时会取得对应的解析结果。

`Variable.parse(astController)` 在普通消费时插入 `@property` 注册及 Variable 自身状态定义，再返回可输出的 CSS `var()` Value。Variable 生成状态内容节点时直接携带选中的状态，解析器从该节点内容入口沿返回值与 contents 传递；嵌套 Variable 按同名状态读取内容，缺失时取默认内容，无 states 的来源也取默认内容，不把来源其他状态加入当前 Variable。普通 Rule 消费仍保留 CSS 引用。状态定义由 Variable 自己确定地址与插入顺序，不生成状态交集。自动状态定义按即将插入的目标地址查找最近的同一 Variable 局部声明，使用其基础值 Key；没有局部声明时使用 `config.definitionKey`。自动产物以 Variable 对象作为不透明 `productTag`，局部声明通过通用产物查询和语义父链清理归属自身的旧产物；`productTag` 只供查询，不改变节点来源所有权或资源替换。Compiler 不按 Variable 类型分支。Cluster 的成组声明由 Cluster 自己配对并插入普通队列节点；按需依赖使用同一解析和输出链。

## 输出阶段

`JSSContentNode` 是解析完成的声明，保留输出地址、JSSKey、内容对象及子内容解析结果。其 `conditionPath` 已合并 target/state，描述最终 CSS 嵌套位置。同址同名至少两项在稳定队列中默认形成逗号数组 Value，或调用组内唯一显式 Key `join`；若结果带待解析内容，继续进入解析波。输出器读取最终队列内容对象的 `toCSSString`，打开和关闭条件块并返回 CSS 字符串，不再解析或聚合。

相关实现：[Rule](../rule.ts)、[JSSKey](../key.ts)、[JSSContent](../content.ts)、[Value](../value.ts)、[Variable](../variable.ts)、[Rules 到样式节点](../compiler/rules-to-style-nodes.ts)、[样式节点到内容节点及 ASTController](../compiler/style-nodes-to-content-nodes.ts)、[内容节点到 CSS 字符串](../compiler/content-nodes-to-css-string.ts) 与 [CSSRoot](../css-root.ts)。正式入口覆盖见 [内容解析波测试](../test/内容解析波遍历及插入节点.test.ts) 和 [样式登记与依赖测试](../test/样式登记经依赖解析生成CSS.test.ts)。

`detach` 只移除当前展开入口的输出位置，保留其来源和产物；`removeNode` 撤销节点，并删除失去全部来源的后继。待入队依赖只接受仍存活的来源，共享资源不会因一个消费者消失而被撤销。节点插入和移动统一由 ASTSession 执行。

Variable 的 declare/modify 内容和其他内容一样直接调用 parse；AST 只按调用方指定的谓词和位置查询父节点、邻近节点，不认识 Variable 或修改步骤。Compiler 不设专门的改写器阶段。
