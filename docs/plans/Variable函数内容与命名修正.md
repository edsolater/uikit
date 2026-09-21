# Variable 函数内容与命名修正 Plan

实施状态：第一阶段已实现并通过验收，等待用户确认。第二阶段尚未开始；用户确认结果后，才全量检查和修正 Variable 命名。

## 修改目标

本 Plan 分两步完成：

1. Variable 可以保存直接 `ValueInput`，也可以保存 `() => ValueInput`。函数在创建 Variable 时不执行，编译实际消费该 Variable 时才执行；返回结果继续按统一 ValueInput 协议编译。
2. 按 [Style System 命名](../../src/style-system/naming.md) 检查全部 Variable 与 Variable Cluster。名字必须表达用途与存在形式，成员键继续只表达 default、soft、line 等组内选择。

两步不同时实施。第一阶段通过后停止，由用户判断是否进入第二阶段。

## 第一阶段：Variable 接受函数内容

### 已确认行为

- Variable 仍然只有一种，不增加原始、派生或智能 Variable 类型。
- `variable('blue', options)` 继续保存直接内容。
- `variable(() => colorMix(...), options)` 保存函数本身，不在定义时调用 `colorMix()`。
- 编译器消费 Variable 时执行函数，并把返回的字符串、数字、Value、Variable、CSS Function 或 `undefined` 交回现有 ValueInput 编译链。
- Variable Cluster 和 CSS Function 都可能是可调用对象，不能被误判为普通 source 函数。
- `states` 回调继续接收 `variable()` 的原始首参数；本阶段不改变状态协议。
- source 函数只允许出现在 Variable 定义入口，不把裸函数扩散成所有 RuleValue 都可接受的内容。

### 用户指定的验收案例

抽象层定义两个颜色 Cluster：

```ts
const toneDefaultColor = variable('blue', {
  name: 'tone-color',
})

const toneColor = variableCluster({
  default: toneDefaultColor,
  soft: variable('lightblue', {
    name: 'tone-soft-color',
  }),
  line: variable(
    () => colorMix([toneDefaultColor, 0.32], 'transparent'),
    { name: 'tone-line-color' },
  ),
})

const accentColor = variableCluster({
  default: variable('red', {
    name: 'accent-color',
  }),
  soft: variable('pink', {
    name: 'accent-soft-color',
  }),
})
```

Button 业务层只消费 line，并在嵌套 tone 条件中声明整组材料：

```ts
rules(button, [
  ['background', toneColor('line')],
])

rules([...button, '&[data-tone="accent"]'], [
  [toneColor, accentColor],
])
```

验收必须证明：

- CSS 保留 Button 的嵌套结构；
- Cluster 只声明双方共有的 default、soft；
- line 没有被来源覆盖，仍保留自己的函数配方；
- 普通 Button 的 line 根据 blue 混色；
- accent Button 的同一配方通过当前 `--tone-color` 根据 red 混色；
- blue、lightblue、red、pink 都是直接 Value，不增加底层颜色 Variable。

### 代码落点

| 位置 | 第一阶段责任 |
| --- | --- |
| `src/style-system/core/css-variable.ts` | 定义 VariableSource，保存直接内容或 source 函数；保持 Variable 黑盒和现有 states 契约 |
| `src/style-system/compiler/compile-variable.ts` | 在编译 Variable 引用时识别并执行 source 函数，再复用 readValue |
| `src/style-system/index.ts` | 若公共类型需要使用 VariableSource，只导出类型，不增加新的运行入口 |
| Compiler 单元测试 | 锁定延迟时机、返回内容种类、可调用对象区分、循环引用和用户指定的嵌套 CSS |
| Browser 测试 | 验证同一 line 配方在普通与 accent Button 作用域读取不同 default |

### 第一阶段验证

依次执行：

```powershell
bun run type-check
bun run test:unit
bun run test:browser
git diff --check
```

第一阶段全部通过后停止，不进入命名批量修改。

### 第一阶段实施结果

- `VariableSource` 已接受直接 ValueInput 与 `() => ValueInput`。
- Variable 创建时只保存 source 函数；`compile-variable.ts` 在消费 Variable 时执行一次本次引用使用的 source 函数，并把结果交给 `readValue()`。
- Variable Cluster 与 CSS Function 继续由原有身份判断处理，不会被误执行为普通 source 函数。
- 用户指定的 tone／accent 嵌套 Button 案例已经进入单元测试和浏览器测试：普通背景根据 blue 混色，accent 背景在同一 line 配方下根据 red 混色。
- 函数返回直接内容、Variable、CSS Function 及循环返回自身的边界均有现有或新增测试覆盖。

2026-09-21 第一阶段验证结果：

- `bun run type-check`：通过。
- `bun run test:unit`：32 个文件、160 项通过。
- `bun run test:browser`：13 个文件、70 项通过。
- `git diff --check`：通过。

第一阶段按计划停在这里，未开始第二阶段命名修改。

## 第二阶段：Variable 命名修正

第二阶段尚未开始。用户确认第一阶段后再执行：

1. 扫描全部 Variable 与 Variable Cluster 定义、CSS Custom Property 名字及引用。
2. 对照命名文档检查用途、存在形式、完整单词和领域归属。
3. 修正 `toneDefault`、`toneLine` 这类缺少 Color／Size 等形式结尾的名字，以及 A／B、缩写和只描述实现位置的临时名字。
4. 同步源码、测试、文档和实际 CSS 名字；先列出影响与映射，再实施批量修改。
5. 完成类型、单元、浏览器、构建和下游影响验证。

第二阶段不能用第一阶段测试通过替代，也不能在第一阶段顺手改名。
