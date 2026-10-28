# Token 的定义组合与 modify

本文描述 Token 的契约，源码已完成 Token 迁移。定义组合使用普通函数返回新 Token；modify 表达指定条件内对目标 Token 的修改。两项职责不需要独立 adjust 或创建历史机制。

## 函数组合新定义

函数可以读取来源 Token 的 default、state 及其他规范化信息，决定加工哪些值、继承哪些配置、覆盖哪些项，再返回一个 Token。需要沿用或改变状态的函数应直接表达该组合，不依赖内置 Variant 或结果来源记录。

state 的创建输入接受静态预置快捷名的字符串对象或带 StateCondition 的 entry，解析后统一为 Map。未定义字符串立即报错，原始 CSS 先交给 stateCondition。加工已有定义时读取该 Map，不再按对象枚举或展开；条件对象继续作为键保留：

```ts
const compact = token(source.default, {
  address: '.Compact',
  state: [...(source.state ?? []), [whenHover, '6px']],
})
```

stateCondition(input) 创建独立的局部主体条件。字符串 hover/active 与对应对象均只判断交互状态，enabled、disabled 等条件独立匹配；不同属性的效果共同生效，同一属性按 CSS 层叠决定结果。

只改变基础值和加工每个状态结果，是不同的函数行为。基础 10、hover 为基础加 3、active 固定 12 时：

| 函数表达的变化           | 普通 | hover | active |
| ------------------------ | ---- | ----- | ------ |
| 基础换为 5，保留状态规则 | 5    | 8     | 12     |
| 各项最终结果乘 0.5       | 5    | 6.5   | 6      |

这两项都可以由普通函数读取定义并组合新 Token，不需要为每种加工增加对象种类。新 Token 保存已经组合好的定义；后续替换 default 不重放此前加工。需要继续读取来源当前 CSS 值时，直接把来源 Token 放进 default 的表达式中。

## Modify 修改明确范围内的目标

以下沿用现有修改调用形状示意目标行为，源码已迁移至 Token：

```ts
const size = token('4px', { address: '.Meter' })
rules('.Meter', [
  modify(size, {
    type: 'expression',
    detail: (current) => add(current, '3px'),
  }),
  modify(size, {
    type: 'expression',
    detail: (current) => multiply(current, 2),
  }),
  [key('width'), size],
])
```

先加再乘为 14px，交换为 11px。current 表示当前 CSS 表达式，不要求 JavaScript 先读取浏览器算好的数值。modify 需要目标具有 CSS variable 身份，系统调整内部 _kind；缺名时自动分配，调用方不必先命名或补一条无值声明。

修改只在明确的条件和位置生效，条件外保留原结果。显式 address 固定 state 的归属；未指定地址时，Token 的 default 与 state 随当前 AST 消费位置建立，不能把这一规则误认为 modify 搬运了状态。内部类型改变是本次 AST 的编译处理信息，_kind 可对外读取，调用方按约定不修改。

## 坍缩前读完会影响结果的修改

onFirstScan 可以返回包含 modify 的规则。系统需要继续读取这些规则，直到所有影响相关 Token _kind 与结果的修改都已确定，再进行坍缩；不限定激活次数或波次。

先读取 width 的 Token 引用、后发现 modify，不能使这两处使用不同身份。Token 不在创建时或构造表达式时输出最终 CSS，因而能在坍缩前取得一致的内部类型和名称。compileWaveIndex 约束内容处理时机，不是允许提前输出的理由。

## 状态与 CSS 求值位置

若 size 显式指定 address: ':root'，根定义普通 4px，根的 data-phase state 为 8px；Parent 明确 modify 加 3px，Child 位于 Parent 内且只读取 size，则 state 先在根选择，Parent 加工这个结果，Child 继承 Parent。

| 条件                             | Parent | Child |
| -------------------------------- | ------ | ----- |
| 根无标记                         | 7px    | 7px   |
| 仅 Parent 或 Child 有 data-phase | 7px    | 7px   |
| 根有 data-phase                  | 11px   | 11px  |

这不把根 state 搬到后代，也不要求复制状态定义。配方输入只在实际公式位置响应；边界见 [CSS作用域与层叠.md](CSS作用域与层叠.md)。

## 顺序、撤销与资源

撤销乘法步骤后只剩加法，结果为 7px，不能清空整条链或重复执行剩余步骤。共享步骤与不同条件的候选仍须保持明确归属，条件选择交给 CSS；同一修改不能因嵌套主体而无意累计两遍。

主动采用 dangerous 手动重声明时，同址新值和 modify 的先后顺序仍需保留：先新值后 modify 加工新值，后写新值覆盖此前修改。这是保留的低层能力，不要求正常使用 modify 前先手动声明；组件基础和状态写在自身定义。不同地址遵循浏览器层叠，registration 的类型、继承和初始值约束继续成立。Token 不保存 priority。

内容替换后采用新修改，撤回旧独占资源，保留其他步骤和共享需求。普通函数产生的新 Token 同样只依据实际内容引用激活资源，不追踪创建历史，见 [按需资源与同名替换.md](按需资源与同名替换.md)。
