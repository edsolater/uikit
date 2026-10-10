# 修改目标

状态：历史提案。本文保留当时的方案与调查；状态职责后续由 [按钮状态配方与规则条件职责归位](按钮状态配方与规则条件职责归位.md) 落实。调查中的同名状态读取已退出，来源 Variable 现通过 CSS 引用读取当前值，现役契约见 [变量定义与消费](../../src/style-system/doc/变量定义与消费.md)。

把 Button 被移到逐状态 Rule 的效果迁回 Variable 的 `states`。组件选择配方，Mixin 消费 Variable，StateCondition 提供状态条件与中央顺序，编译器展开变量声明。组件不再为同一效果手工登记按钮 hover、按钮 active、按钮 disabled 的消费规则。

本 Plan 专门处理状态职责。[默认颜色派生与声明输入统一](默认颜色派生与声明输入统一.md) 继续负责 `set`、`declare`、`modify`；这些接口的改造不并入本篇。该旧 Plan 中的手写 hover Rule 示例与本次裁决冲突，不作为本篇实施依据，后续整理该篇时需撤出。

# 当前问题与目标形状

[Button.style.ts](../../src/components/kits/Button/Button.style.ts) 当前为 solid 配方分别登记默认、hover、active 的前景色 Rule。虽然路径里使用已登记的状态名，状态效果仍由组件逐项展开；中央条件登记并没有接管这部分职责。

同文件已有正确的责任链：`shadowSolid` 保存 hover、active、disabled 的阴影，`elevation(shadowSolid)` 消费一次；`opacity` 保存 disabled 值，`clickable({ opacity })` 消费一次。颜色也应采用这条链。

下面用现有 `variable`、`states`、Mixin 接口展示 solid 前景色的目标形状。它只说明状态归属，不是完整 Button 方案，也不决定配色来源与共享角色的接法。

```ts
const solidForegroundColor = variable(
  colorMix([actionColor('foreground'), 0.9], surfaceColor),
  {
    name: 'button-solid-foreground-color',
    states: {
      hover: actionColor('foreground'),
      active: actionColor('foreground'),
    },
  },
)

rules(solidButton, [
  color({ foreground: solidForegroundColor }),
  elevation(shadowSolid),
])
```

状态值属于 `solidForegroundColor`；`color` 仅把它映射到颜色属性；编译时根据已登记的 StateCondition 生成变量的状态声明。最终 CSS 仍有状态条件，但这些条件由正式编译链生成。不能为了省一个 Variable 把它的状态配方搬回组件 Rule，也不能为每个状态再造一个 Variable。

# 哪些内容进入 state

| 内容 | 归属与改动判断 |
| --- | --- |
| 同一背景、前景、阴影、透明度或光标在 hover、active、focus、disabled 下的不同取值 | 对应 Variable 的默认内容与 `states`；Mixin 消费该 Variable |
| hover、active、focus、disabled 的名称、匹配条件与优先顺序 | 现有 StateCondition 登记；组件不复制 selector 或自行排列优先级 |
| variant、tone、size 的分类与材料选择 | 组件 Rule 选择使用哪份配方；选中的配方自身携带状态 |
| loading 等 status 下的专属效果 | 先保留组件的业务选择；其中光标遇到 disabled 的变化仍归光标 Variable。若需提升为通用 StateCondition，另以明确业务依据裁决 |
| variant 与 tone 同时成立时的专属配方 | 先核实是否确有独立视觉意图；必要的分类选择可保留，但该配方的 hover／active 仍放入 Variable |

StateCondition 拥有“何时成立”，Variable 拥有“成立时取什么值”。Mixin 拥有效果到属性的映射，不识别 Button 分类、不读取状态图，也不增加状态分支。Variable 可由组件或通用 Pieces 定义，按配方的实际归属决定位置。

# 代码落点与实施顺序

| 落点 | 当前职责 | 计划处理与理由 |
| --- | --- | --- |
| [Button.style.ts](../../src/components/kits/Button/Button.style.ts) | 组件分类、材料选择与效果组装；颜色状态被拆成逐状态 Rule | 清点默认、bare、solid、tone 及必要组合配方，把同一效果的状态值收回 Variable，再交给 Mixin 消费 |
| [variable.ts](../../src/style-system/variable.ts) | 保存状态内容；`declareVariableStates` 展开定义，`readState` 读取依赖的同名状态 | 优先复用现有展开链；若局部颜色来源无法正确接通，修复内容与声明的衔接，不让 Button 代替编译器展开 |
| [state-conditions.ts](../../src/style-system/pieces/state-conditions.ts)、[interaction.ts](../../src/style-system/pieces/conditions/interaction.ts) | 中央名称、顺序、条件；hover／active 排除 disabled | 保留中央责任，核实生成结果符合已有条件；仅在验证发现实际缺口时修改，不新建平行登记表 |
| [appearance.ts](../../src/style-system/pieces/mixins/appearance.ts)、[interaction Mixin](../../src/style-system/pieces/mixins/interaction.ts) | 接受内容并输出颜色、阴影、交互属性声明 | 直接接收携带状态的 Variable；不增加逐状态重发属性的能力 |
| [变量定义与消费](../../src/style-system/doc/变量定义与消费.md)、[样式文件写法](../style/样式文件写法.md) | 目前包含普通状态 Rule 与前序修改的建议 | 实施时修正状态归属与示例；与另一篇 Plan 协调接口说明，不将状态职责混成默认颜色设置协议 |

1. **清点状态配方。** 按效果列出每份 Button 配方的默认值与状态值，区分分类选择和状态变化。以用户指出的 solid 前景色作为第一条完整迁移链。
2. **验证现有状态消费链。** 用 Variable → Mixin → 编译的最小案例确认状态声明生成、来源状态读取、中央顺序与消费位置。现有 `states` 已能表达时直接使用。
3. **接通颜色来源。** 验证 tone 整组声明、共享颜色角色和配方依赖在状态下的取值。上一轮逃生字符串的来源问题必须由 Style System 正式契约解决，不能只恢复旧代码后接受错误配色，也不能重回手写状态 Rule。
4. **迁移 Button。** 逐份替换颜色状态 Rule；disabled 的颜色效果同样交给状态配方。涉及 `set`、`declare`、`modify` 的具体写法等待对应 Plan 的接口裁决，不能沿用旧 CSS 前序链作为本篇前提。
5. **同步说明并验收。** 更新状态职责说明与示例，检查完整 Button 文件及生成 CSS，再运行类型检查、单元测试、浏览器测试、构建与差异检查，由独立审查者核对最终责任链。

# 验证与失败条件

复用 [样式状态只由变量自身承担](../../src/style-system/doc/behaviors/样式状态只由变量自身承担.md) 的既有行为契约，以及 [状态名称登记测试](../../src/style-system/test/状态名称登记并用于变量编译.test.ts)、[状态顺序与来源链测试](../../src/style-system/test/状态顺序与变量来源链共同决定取值.test.ts)。新增验证应针对实际缺口，不另造状态测试入口。

- 最小颜色案例：一个 Variable 默认红色、hover 蓝色、active 绿色，经 `color({ foreground })` 消费后，颜色属性只有一份消费声明，变量定义分别生成默认、hover、active 三份声明。若颜色属性为状态被重复输出，验收失败。
- 中央顺序：调换 Variable 内 hover、active 的书写顺序不改变生成结果；同时命中时按已登记顺序取值，不能依赖 Button Rule 的书写先后。
- Button 浏览器行为：默认、bare、solid 与 accent／danger 配方分别验证按钮 hover、按钮 active、按钮 disabled 和状态退出；原生 disabled 与 UIKit disabled 都抑制 hover／active 效果。
- 来源正确：局部选择 accent／danger 后，状态下背景、前景和焦点仍使用该配方应有的材料；切换配方不残留上一份颜色。不能仅凭纯默认配方测试通过就确认来源链正确。
- 结构正确：Button 不再手写这些效果的逐状态 Rule，也不拼 CSS `var()` 或调用 `toCSSString()`；Mixin 不判断状态，生成的状态定义仍由 Variable 与 StateCondition 链承担。源码检查与行为断言一起验收。
- 作用域正确：同一配方在两个组件位置消费时，各自状态条件与局部材料互不污染；移除消费后不遗留派生声明。

已有视觉测试通过只证明覆盖到的表现，不能证明责任归属正确。迁移应保留明确的视觉意图；专属交集比例若需要改变，先记录改动目的和预期结果，不能借状态迁移默默改掉。

# 实施前需核实

1. **局部材料如何进入状态配方。** 当前依赖 Variable 的状态消费有同名状态／默认内容读取契约。需验证它与当前位置 tone、surface、foreground 声明的关系，明确必要调整的负责文件。目标已确定为正式 Variable 状态链，具体接法须有可执行案例支持。
2. **组合配方是否确有独立意图。** 当前 bare＋tone、solid＋tone 存在专属比例，不能仅因已有代码就认定它们必须保留，也不能未经依据删除。此判断只影响配方内容与选择，状态展开责任始终保持一致。

本篇不重新裁决默认颜色来源、声明返回类型或修改算子。若实施依赖另一篇 Plan 的接口，记录该依赖并按已确定契约衔接。
