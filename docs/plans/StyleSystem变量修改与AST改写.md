# Variable 局部定义与修改的 AST 实现 Plan

状态：按最新职责裁决完成实现，验证证据见 [实施详情](StyleSystem变量修改与AST改写_实施详情.md)。Variable 的稳定目的与能力以 [变量定义与消费](../../src/style-system/doc/变量定义与消费.md) 为准；本文只规定修改途径和实现边界。

## 从入口到 CSS

```ts
const amount = variable(1, {
  name: 'amount',
  states: { hover: 10 },
  modification: {
    apply: (current, change) => createJSSContent(
      read => `calc(${read(current)} + ${read(change)})`, [current, change]),
  },
})
rules('.Button', [amount.declare(), [key('z-index'), amount]])
rules(['.Button', 'hover'], [amount.modify(3)])
rules('.Panel', [amount.declare(20), [key('z-index'), amount]])
```

创建 Variable 的首参数是稳定 defaultValue，只保存内容与配置。declare/modify 返回 Declaration，只有内容被 Compiler 消费时，其 parse 才在 AST 中展开。CSS 编译一次；浏览器选择状态，Button hover 为 13，Panel 仍为 20。

```text
Variable.declare / modify
→ VariableModification 中声明内容的 parse
→ 查询 AST 当前位置与最近语义父定义
→ 在定义处或原修改位置插入所需声明
→ 普通内容解析继续处理返回表达式的依赖
→ CSS string
```

## 责任应放在哪里

| 位置 | 应承担的能力 | 不应带入的内容 |
| --- | --- | --- |
| variable.ts | 同一 Variable 对象及类型；创建配置、引用、状态、注册，以及 declare/modify 调用入口 | 不维护局部修改步骤或全局修改提交集 |
| variable-modification.ts | 局部声明基础值、相对修改步骤与编译会话中的连接、重绑、撤销 | 不定义新公共控制器，不缓存整组表达式再重建 |
| compiler/ast-controller.ts | 当前节点、指定位置插入、按谓词查最近语义父节点/邻近节点、共享来源与撤销 | 不认识 Variable、Modifier、步骤或业务状态 |
| compiler/style-nodes-to-content-nodes.ts | 继续处理待解析内容、按需 Rules、重访和完成判断 | 不设置某一波专门执行修改，不为 Variable 另设调度阶段 |
| variable-cluster.ts | 选择成员、代理默认 Variable、已有整组赋值配对 | 不拥有独立修改算法 |

当前实际目录如下；定义与修改没有独立调度目录。

```text
src/style-system/
    variable.ts
    variable-modification.ts
    variable-cluster.ts
    condition.ts
    compiler/
        ast-controller.ts
        rules-to-style-nodes.ts
        style-nodes-to-content-nodes.ts
        content-nodes-to-css-string.ts
    doc/
        变量定义与消费.md
    test/
        变量修改与条件组合.test.ts
        变量修改与条件组合.browser.test.ts
        内容解析直接操作AST.test.ts
```

删除只有传递作用的独立 Rewriter 协议与操作对象中转；VariableModification 承接局部声明与修改链的实际编译责任，Variable 维持公开调用入口。现有普通内容协议已足够，不增加另一套生命周期。

## 每次修改怎样局部展开

无修改时只输出普通基础定义。有第一条修改时，该定义拥有基础出口与最终出口。每个新步骤生成一个稳定输入引用和一个结果名：

```css
.Button {
  --amount-base: 1;
  --amount-step-a-input: var(--amount-base);
  --amount-step-a: var(--amount-step-a-input);
  --amount: var(--amount-step-a);
}
.Button:hover {
  --amount-base: 10;
  --amount-step-a: calc(var(--amount-step-a-input) + 3);
}
```

以上名称用于阅读；实现可以生成唯一数字名。数字只保证唯一，不能用减一或大小关系推断前驱。

若稍后解析出应位于 a 前面的 b，b 的输入接基础值，a 的输入改接 b 的输出；a 的 apply 表达式不重新执行。若 b 位于末尾，最终出口改接 b。删除中间步骤也只重连它两侧的引用。实际相邻关系来自 AST 的位置，不来自名称、不来自解析先后。

每个步骤只保存自己的输入、默认赋值、条件赋值与相邻连接。没有 `DefinitionGroup/generated/expressions` 整组扫描和表达式缓存。共享 ID 的多个条件保留各自赋值，但使用同一个步骤；其位置由仍存活的第一条声明决定。

默认传递声明必须在真实赋值之前，包括 modify 在源顺序中早于 declare 的情况。只移动内部默认声明，不改变业务条件路径，也不重排普通 `[variable, value]`。

## 生命周期与依赖

- 最近定义按原始 semanticPath 和 Variable 对象身份匹配。状态输出排序不能破坏原父链。
- 定义迟到时，相关修改通过普通 revisit 自行重绑；旧表达式的独占依赖撤销，共享依赖保留。
- 修改返回的表达式交回普通 parse/onActive。当前修改不提前遍历其引用，不等待全局稳定。
- payload 原样交 apply；未使用参数不触发内容解析，框架不增加参数合法性判定。apply 自身错误正常暴露。
- declare(value) 的基础内容只由基础声明消费。无参数时 defaultValue 生产函数在该局部定义展开时执行一次；普通引用仍按自身消费时机处理。局部定义和修改不改写创建默认值。
- `registration.initialValue` 是独立的 CSS 描述符，不从 defaultValue 猜类型或初始值。根位置、主题和减少动效由普通 Condition Rule 表达；具体 Atom 在 Variable 创建选项中提供通用 `onActive`，消费时才按需输出。
- Variable 的 `config` 保存一次创建配置，并提供 `definitionKey` getter，在使用时按当前名称生成声明 Key。自动状态声明由 AST 保持产物来源；Variable 生成状态声明时将选中的状态直接随内容节点传入解析链；parse 的状态参数沿返回值与 contents 传递，使嵌套来源按该项状态取内容，缺失则取默认内容，不从复合地址改选其他状态，也不收集来源其他状态。自动声明按目标路径由 AST 查找最近局部定义，不维护独立路由表。局部定义和修改步骤属于编译会话。成员状态继承由 Cluster 创建普通 Variable 完成，Variable 不保存继承关系。公开 Variable 类型直接包含 `config`。
- detach 保留隐藏入口的来源链；removeNode 撤销失去全部来源的后继。待入队内容必须仍有存活来源。
- 找不到所需定义可以等待本轮真实新增内容；无实际进展则明确失败，不用固定波号绕过依赖。

## 工程顺序与验收

1. 在 Variable 中建立自身 declare/modify 入口，迁移正式消费者和测试。
2. 接管原来的定义、状态、注册、最近归属与共享 ID；删除无独立责任的中转。
3. 改为每个修改局部展开，以 AST 位置连接输入与输出，验证晚到前插及撤销。
4. 将 `VariableOptions.root` 的消费者迁到首参数或普通 Condition Rule；需要根上求值的 Atom 用现有 `onActive` 按需提供根规则。
5. 将原 `VariableDefinition` 和 WeakMap 查表改为同一 Variable 对象的 `config`；Cluster 继续代理默认对象属性，删除多余连接入口。
6. 将通用 `onActive` 纳入创建选项，`variable()` 一次生成完整对象；迁移 Atom 和现役案例中的事后赋值。Cluster 成员继承通过 `clusterFrom` 按同名来源成员生成普通 Variable。
7. 更新目的文档、现役架构和本 Plan；实际变更原因、代价、命令证据记录在实施详情。

必须验证：defaultValue 不被局部定义/修改改变、环境规则按需进入 CSS 且浏览器切换不重编译、两组件独立、状态基础 10 加 3 等于 13、任意参数原样传递、普通覆盖仍成立、先修改后定义、非交换顺序、晚到前插不重算既有 apply、中间撤销、共享首声明撤销、晚到更近定义重绑、共享依赖、未用参数不激活、Cluster 默认代理以及真实浏览器退出条件恢复。

已有明确类型 registration 同步到基础和结果步骤；数值 1000 项、尺寸和颜色 200 项须由浏览器验证。输入引用会增加每步骤一条 CSS 声明，必须重新记录输出规模。未注册或 syntax 为 * 的计算仍受浏览器表达式限制，不猜测 Value 类型，不宣称物理无限。

结构验收独立于测试：不能只是把旧整组维护藏进另一文件，不能在 AST 加入修改业务，也不能为了旧测试的内部编号形状维持错误抽象。
