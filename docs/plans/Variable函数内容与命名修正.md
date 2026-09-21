# Variable 函数内容与命名修正 Plan

实施状态：第一阶段已实现并通过验收。第二阶段已按“稳定对象在前、成员与档位后置”完成重命名；显式组合 Variable 作为临时方案保留并标注 `TODO`，其运行时组合改造进入下一步计划。

## 修改目标

本 Plan 分两步完成：

1. Variable 可以保存直接 `ValueInput`，也可以保存 `() => ValueInput`。函数在创建 Variable 时不执行，编译实际消费该 Variable 时才执行；返回结果继续按统一 ValueInput 协议编译。
2. 按 [Style System 命名](../../src/style-system/doc/naming.md) 检查全部 Variable 与 Variable Cluster。名字必须表达用途与存在形式，成员键继续只表达 default、soft、line 等组内选择。

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
const toneColorDefault = variable('blue', {
  name: 'tone-color',
})

const toneColor = variableCluster({
  default: toneColorDefault,
  soft: variable('lightblue', {
    name: 'tone-color-soft',
  }),
  line: variable(
    () => colorMix([toneColorDefault, 0.32], 'transparent'),
    { name: 'tone-color-line' },
  ),
})

const accentColor = variableCluster({
  default: variable('red', {
    name: 'accent-color',
  }),
  soft: variable('pink', {
    name: 'accent-color-soft',
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

第一阶段按计划停在这里；用户确认后才开始第二阶段命名修改。

## 第二阶段：Variable 命名修正

用户确认第一阶段后，第二阶段按以下范围执行：

1. 扫描全部 Variable 与 Variable Cluster 定义、CSS Custom Property 名字及引用。
2. 对照命名文档检查用途、存在形式、完整单词和领域归属。
3. 修正缺少 Color／Size 等形式结尾的名字，以及 A／B、缩写和只描述实现位置的临时名字。
4. 同步源码、测试、文档和实际 CSS 名字；先列出影响与映射，再实施批量修改。
5. 完成类型、单元、浏览器、构建和下游影响验证。

第二阶段不能用第一阶段测试通过替代，也不能在第一阶段顺手改名。

### 第二阶段曾被推翻的中间实现

- 这一节记录重命名过程中已经被后续裁决推翻的中间结果，不能作为现役命名依据。
- `headingSize` 曾被保留；后续确认它没有稳定 Heading 服务对象，已改为 `textSizeExtraExtraLarge`。
- action Cluster 的默认成员没有独立的“默认颜色”概念，直接内联定义，由 `actionColor` 表达整组颜色；不建立 `actionDefaultColor`。
- Button 基础样式不是一个名为 default 的材料，`buttonDefaultSurfaceColor`、`buttonDefaultForegroundColor`、`buttonDefaultOpacity` 分别改为 `buttonSurfaceColor`、`buttonForegroundColor`、`buttonOpacity`。
- `smallSize` 等名字没有说明谁的尺寸；这些材料实际定义控件尺寸档位，改为 `smallControlSize`、`normalControlSize`、`largeControlSize`、`extraLargeControlSize`。
- `neutralBaseColor` 实际就是中性色阶 0，改为 `neutralZeroColor`，CSS 名字统一为 `neutral-0-color`。danger 的默认入口实际选择 strong 颜色，原 `dangerBaseColor` 改为 `dangerStrongColor`，由 default 与 strong 共同引用。
- Button、通用材料与 Mixin 的其余 Variable／Cluster 均已核对；名字已经表达用途与形式，没有为了制造改名数量而改写。
- 文档示例统一使用 `toneDefaultColor`、`toneSoftColor`、`toneLineColor` 等完整名字。
- Style System 自身的设计说明进入 `src/style-system/doc/`，架构保留在 Style System 根目录。`docs/style/**` 不属于本 Plan 的修改范围，保持原样。

### 命名重新裁决表

当前命名讨论按“稳定对象在前，成员、档位或选择结果作为后缀”的结构重新判断。这里的后缀不是普通英文形容词排序，而是对稳定对象的进一步选择。例如 `dangerColorStrong` 表示 `dangerColor` 的 strong 成员，`controlSizeSmall` 表示 `controlSize` 的 small 档位。

Variable 的 CSS 名字保持相同顺序，并补足 CSS 独立作用域所需的领域前缀。例如 Button 文件中的普通变量可以省略 button，而 CSS 名字仍保留 `button-`。

| 对象或系列 | 重命名前代码 | 重命名前 CSS | 实施结果 | 状态与依据 |
| --- | --- | --- | --- | --- |
| action 配色 | `actionColor`；default 成员内联 | `action-color` | 保持 | default 没有独立材料身份，不建立 `actionColorDefault` |
| 间距档位 | `smallSpace`、`normalSpace`、`mediumSpace`、`largeSpace`、`extraLargeSpace`、`wideSpace`、`widestSpace` | `small-space` 等 | `spaceSmall`、`spaceNormal`、`spaceMedium`、`spaceLarge`、`spaceExtraLarge`、`spaceWide`、`spaceWidest`；CSS 同序 | 已实施；`space` 是稳定对象，档位后置 |
| 边界宽度 | `thinBoundaryWidth` | `thin-boundary-width` | `boundaryWidthThin`；`boundary-width-thin` | 已实施；thin 是档位 |
| 控件尺寸 | `smallControlSize`、`normalControlSize`、`largeControlSize`、`extraLargeControlSize` | `small-control-size` 等 | `controlSizeSmall`、`controlSizeNormal`、`controlSizeLarge`、`controlSizeExtraLarge`；CSS 同序 | 已实施；`controlSize` 是稳定对象 |
| 文字尺寸前三档 | `normalTextSize`、`largeTextSize`、`extraLargeTextSize` | `normal-text-size` 等 | `textSizeNormal`、`textSizeLarge`、`textSizeExtraLarge`；CSS 同序 | 已实施；`textSize` 是稳定对象 |
| 24px 文字尺寸 | `headingSize` | `heading-size` | `textSizeExtraExtraLarge`；`text-size-extra-extra-large` | 当前没有稳定 Heading 服务对象；唯一消费者是 xlarge Button，基础 CSS 对应 2xl 字号。若以后建立真正的 Heading 排版角色，才重新采用 `headingSize` |
| 阴影档位 | `flatShadow`、`lowShadow`、`raisedShadow`、`elevatedShadow`、`interactiveShadow` | `flat-shadow` 等 | `shadowFlat`、`shadowLow`、`shadowRaised`、`shadowElevated`、`shadowInteractive`；CSS 同序 | 已实施；档位或配方后置 |
| 动效材料 | `fastDuration`、`standardEasing` | `fast-duration`、`standard-easing` | `durationFast`、`easingStandard`；CSS 同序 | 已实施；fast、standard 是档位后缀 |
| 中性色阶 0 | `neutralZeroColor` | `neutral-0-color` | `neutralColor0`；`neutral-color-0` | 已实施；数字直接作为后缀，不写 Zero |
| danger strong 成员 | `dangerStrongColor` | `danger-strong-color` | `dangerColorStrong`；`danger-color-strong` | 已实施；`dangerColor` 是稳定身份，strong 是成员 |
| Button 默认表面／前景 | `buttonSurfaceColor`、`buttonForegroundColor` | `button-surface-color`、`button-foreground-color` | `surfaceColorDefault`、`foregroundColorDefault`；CSS 为 `button-surface-color-default`、`button-foreground-color-default` | 已实施；Button 规格中需要与 bare、solid、tone 局部配方区分，JS 不重复文件已经提供的 button 主语 |
| Button 通用透明度 | `buttonOpacity` | `button-opacity` | `opacity`；CSS 保持 `button-opacity` | 已实施；它适用于所有 variant，不是 default 成员 |
| Button bare 表面 | `buttonBareSurfaceColor` | `button-bare-surface-color` | `surfaceColorBare`；`button-surface-color-bare` | 已确认理解；bare 是 `surfaceColor` 的延伸选择 |
| Button solid 材料 | `buttonSolidSurfaceColor`、`buttonSolidForegroundColor`、`buttonSolidShadow` | `button-solid-*` | `surfaceColorSolid`、`foregroundColorSolid`、`shadowSolid`；CSS 将 solid 后置 | 已实施；solid 是对应稳定对象的延伸选择 |
| Button tone 材料 | `buttonToneSurfaceColor`、`buttonToneForegroundColor` | `button-tone-*` | `surfaceColorTone`、`foregroundColorTone`；CSS 将 tone 后置 | 已实施；tone 表示存在动作语气时的配方 |
| Button bare 与 tone 交集 | `buttonBareToneSurfaceColor` | `button-bare-tone-surface-color` | 临时 `surfaceColorBareTone`；`button-surface-color-bare-tone` | 已实施并加 `TODO`；显式交集配方不可组合，下一步改为运行结果组合并删除此 Variable |
| Button solid 与 tone 交集 | `buttonSolidToneSurfaceColor`、`buttonSolidToneForegroundColor` | `button-solid-tone-*` | 临时 `surfaceColorSolidTone`、`foregroundColorSolidTone`；CSS 同序 | 已实施并逐项加 `TODO`；显式交集配方不可组合，下一步删除 |
| Button loading 光标 | `buttonLoadingCursor` | `button-loading-cursor` | `cursorLoading`；`button-cursor-loading` | 已实施；loading 是 `cursor` 的状态选择 |

#### bare／solid 与 tone 交集的真实代码

Button 的 variant 与 tone 是两个独立条件。下面两个 Variable 不是从 `surfaceColorTone` 派生出的子成员，也不存在 `ToneBare`、`ToneSolid` 这样的领域对象：

```ts
// TODO: bare 与 tone 的显式交集配方不可组合；下一步改为由独立效果在运行结果中组合，并删除这个交集 Variable。
const surfaceColorBareTone = variableFrom(surfaceColor, {
  name: 'button-surface-color-bare-tone',
  states: {
    hover: colorMix([neutralColor(1), 0.82], toneColor('soft')),
    active: colorMix([neutralColor(2), 0.74], toneColor('soft')),
  },
})

rules([...button, '&[data-variant="bare"][data-tone]'], [
  color({ background: surfaceColorBareTone }),
])
```

```ts
// TODO: solid 与 tone 的显式交集配方不可组合；下一步改为由独立效果在运行结果中组合，并删除这个交集 Variable。
const surfaceColorSolidTone = variableFrom(surfaceColor, {
  name: 'button-surface-color-solid-tone',
  states: {
    hover: colorMix([toneColor, 0.88], textColor('strong')),
    active: colorMix([toneColor, 0.78], textColor('strong')),
  },
})

rules([...button, '&[data-variant="solid"][data-tone]'], [
  color({ background: surfaceColorSolidTone }),
])
```

这些定义当前只是保留视觉结果的临时实现，不代表认可显式交集建模。它们不是一棵 Variable 成员树，也不应长期存在；下一步计划要让 bare、solid、tone 的独立效果在运行结果中组合，并删除交集 Variable。

### 第二阶段验证记录

当前验证结果：

- `bun run type-check`：通过。
- `bun run test:unit`：32 个文件、160 项通过。
- `bun run test:browser`：13 个文件、70 项通过。
- `bun run build`：通过。
- Button 实际编译结果使用 `--button-surface-color-default`、`--button-foreground-color-default`、`--button-opacity`、四档 `--control-size-*`、`--text-size-extra-extra-large` 和 `--danger-color-strong`；旧顺序名字不再输出。
- neutral Cluster 的单元测试确认成员 0 与默认入口都使用 `neutral-color-0`，并且 Cluster 类型不再把数字成员宽化为任意 number。
- `palette.ts` 与对应测试入口已删除；`neutralColor` 直接由 `neutral.ts` 定义为 Variable Cluster，`brandColor` 由独立职责文件提供。
- `src/style-system/architecture.md` 负责代码结构；`src/style-system/doc/` 只保存 Style System 自身的设计说明。`docs/style/**` 未纳入本轮改动。
- 本次涉及的 Markdown 本地链接检查与 `git diff --check`：通过。
