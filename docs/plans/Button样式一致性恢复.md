本 Plan 分析 9 月 3 日迁移前的 `Button.css` 与迁移后 `Button.style.ts` 的视觉、交互差异，并记录恢复方案与验收。2026-09-19 已按授权完成修复和逐项验收，正式入口已切回 TS。明暗主题的常态、hover、active 六对截图与固定 CSS 基准完全一致；标记禁用按用户明确裁决统一为 0.56 并排除交互反馈。

原问题结论：差异不只是颜色数值的微调。**variant 与 tone 的组合配方被删减，状态交集改变了覆盖优先级，颜色材料也换了来源与算法。** 此外，圆角形状、布局约束、阴影和禁用策略没有完整迁移。本次已修正 Button 配方、材料来源与预置交互条件，并补齐少量 Mixin 配置；没有修改 Style System 编译核心。下文原因对照中的“当前 TS”均指修复前快照，实施后的结果见监察表及末节记录。

# 执行依据与不可越过的墙壁

用户已授权“好，补足了以后开始改。”，并明确确认“采用这两项推荐方案”：材料复用基础 CSS token，标记禁用统一为 0.56 且排除交互。授权只覆盖本文恢复与验证范围，不包括共享规则或其他组件修改；获得授权不等于验收通过。

## 适用规则与本任务的具体约束

执行前仍须从 [AI Rules 入口](D:/mycode/ai-rules/AGENTS.md) 取得现役规则。下表是各监察点引用的任务依据，不替代原文，也不授权修改这些规则文件。

| 标识与负责规则 | 本 Plan 如何执行它 |
| --- | --- |
| R1：[AI Rules 执行](D:/mycode/ai-rules/rules/Agent-AI-Rules执行.md)、[禁止绕过需求](D:/mycode/ai-rules/rules/Agent-禁止绕过需求.md) | 行动前冻结范围与判定条件，行动后用同一份要求核对；每个差异块必须对应下文监察项，不接受“顺便优化” |
| R2：[理解监察](D:/mycode/ai-rules/rules/Agent-理解监察.md) | variant、tone、状态的意义必须进入真实样式结果；逐项保留正例、反例、实现位置及运行证据 |
| R3：[代码编写](D:/mycode/ai-rules/rules/Code-代码编写.md)、[代码修改](D:/mycode/ai-rules/rules/Code-代码修改.md)、[第一性原理](D:/mycode/ai-rules/rules/Code-第一性原理.md) | 修正产生差异的位置；新增参数须证明必要性，不用外围补偿掩盖源头，也不因局部错误重写系统 |
| R4：[代码修改验收](D:/mycode/ai-rules/rules/Code-代码修改验收.md)、[任务完成判别](D:/mycode/ai-rules/rules/Agent-任务完成判别.md) | 需求效果、代码质量、责任接管分别通过；测试总数、构建成功不能抵消单项失败或未验证 |
| R5：[自主判断边界](D:/mycode/ai-rules/rules/Agent-自主判断边界.md) | 普通实现细节自行查明；范围外行为变化、共享材料所有权和标记禁用语义交回用户裁决，只暂停依赖该裁决的分支 |
| R6：[设计文档内容](D:/mycode/ai-rules/rules/Agent-设计文档内容.md)、[让文本更易读](D:/mycode/ai-rules/rules/Document-让文本更易读.md)、项目 [Plan 写法](../how-to-write-plan.md) | 分开已查明原因、建议方案、未决选择和实施证据；每项均能直接找到落点、墙壁、测试及完成判据 |
| R7：[CSS 选择器结构](D:/mycode/ai-rules/rules/Code-CSS选择器结构.md)、[readonly 约束](D:/mycode/ai-rules/rules/Code-readonly约束.md)、项目 [样式文件写法](../style/样式文件写法.md) | 保留真实 DOM 身份与分层职责；Button 业务组合直接声明，通用效果由 Mixin 承担；不新增只读类型约束或仅为缩短代码的私有包装 |

## 硬性边界

下列“墙壁”是执行者不能自行豁免的限制。用户以后明确调整任务时，先记录新裁决及影响，再修订相应范围；不能凭新写的代码或 Plan 给自己增加权限。

| 墙壁 | 不可违背的规定 | 监察方法与碰壁后的动作 |
| --- | --- | --- |
| W1：授权边界 | 按已确认方案实施本文监察点，范围外变化仍须重新取得授权 | 开始与结束分别核对工作区、暂存区；保留用户已有改动，不自行暂存、提交、回退或清理 |
| W2：禁止顺带修改 | 只处理有监察编号、有必要性证据的差异；同文件、同模块、同类组件均不自动进入范围 | 每个差异块对应编号和“缺少此改动，哪项原要求失败”。重命名、整理格式、删旧机制、修其他失败测试等不能借机混入；确需扩围先报告具体依赖并取得裁决 |
| W3：保护已正确行为 | 尺寸、间距、字号、正常及减少动效、loading、组件 props/事件/原生属性映射、静态登记与统一挂载机制不能被本次修坏 | 修改前保存对应基线，修改后同输入复测。变差就修复本次引入的问题；不能修改旧期望把回归改称“新设计” |
| W4：共享影响边界 | 恢复 Button 不等于授权改变其他组件的外观、共享 Mixin 默认行为或材料消费者协议 | 先列出导入者、CSS 变量读取者及根变量影响，再做非 Button 探针回归。无法保持范围外行为时停止该共享改动，提交影响和局部方案；不顺便迁移消费者 |
| W5：基准与证据固定 | 指定 CSS、原有 token 和完整基础样式共同构成对照；不得改基准、改截图来迎合新实现 | 记录 Git 对象与文件哈希，同一环境隔离比较。禁止通过双样式叠加、关闭交互、删失败用例、放宽色差或跳过检查制造通过 |
| W6：分层职责 | variant/tone 配方留在 Button；预置条件修自身权重；材料只承担材料职责 | 不改编译器、CSSRoot、Piv、状态解析、点击插件或公开 Button API；不加 `!important`、重复选择器加权、Button 专属编译分支。若证明必须跨此边界，先停下重新裁决 |
| W7：未决不能默认同意 | 已批准基础 CSS 材料来源及标记禁用 0.56；不得将这两项裁决扩大为其他消费者视觉调整授权 | 见末节裁决记录；遇到新的范围外变化只暂停依赖分支。事实查证不要求用户代做 |
| W8：完成必须逐项成立 | 每一个小项必须有实际结果与证据，不能由“全量测试通过”代替 | 无证据记未满足并说明“未验证”；任一切换前必需项未满足，不得切正式入口；接入后验收未满足，不得宣称整项修复完成 |

`src/css/tokens/*`、`controls.css`、`all-base.css`、历史 `Button.css` 是本次只读基准；不为配合新实现修改它们。Example 结构、其他组件、依赖版本、构建配置和其他文档不在改动范围。检查这些文件是取证，不是取得修改权限。

后文列出的源文件也不是整文件重构授权：只允许与对应监察点直接相关的声明、类型及必要职责说明变化。发现无关问题记录其位置即可；“维护完整性”“统一风格”“顺便修掉”均不能绕过 W2。

# 对照范围与证据

## 基准版本

用户指定的是 9 月 3 日迁移前的 CSS，不是仓库最早的橙色渐变按钮。

- CSS 基准：`2653ad7^:src/components/kits/Button/Button.css`，与 `c3eb8ae` 中的该文件一致。`2653ad7` 是 2026-09-03 的 CSS → TS 迁移提交。
- 当前 TS：分析时 HEAD 为 `9d8ba455f4e3ea122bf7124f46cf8773d2cb6352`，文件为 [Button.style.ts](../../src/components/kits/Button/Button.style.ts)。
- 分析时运行入口：[Button.tsx](../../src/components/kits/Button/Button.tsx) 导入恢复后的 [Button.css](../../src/components/kits/Button/Button.css)。实施阶段已切回 `./Button.style`；历史 CSS 保留原样，仅用于验收对照。
- 对照仍使用当前组件 DOM 与 Example，不回退整个应用。相关 `color`、`dimension`、`typography`、`elevation`、`motion` token、`color-utils.css` 和 `controls.css` 与 CSS 基准提交比较未发现差异。

## 实测方法与边界

在 Edge `153.0.4234.32` 中打开实际 `/examples/button` 页面。CSS 组直接使用现有页面；TS 组在独立页面中移除 Vite 注入的 `Button.css`，把独立编译得到的 `Button.style.ts` 产物放入 `#css-root`。两组不同时启用两份 Button 样式，不修改仓库导入。

对默认、bare、solid 三种 variant，普通、accent、danger 三种 tone，分别检查明暗主题。每个组合记录常态、真实 hover、鼠标按下、移开鼠标后的键盘空格按下、焦点、禁用及禁用后 hover，共 36 组、252 个状态观察。另查尺寸、减少动效、品牌色覆盖、外部 layer 覆盖和拉伸容器布局。

组合矩阵是在真实 Button 元素上切换 DOM 属性，用于隔离样式原因；它不替代未来通过组件 props 渲染的协议测试。交互等待 120ms 过渡结束后取计算样式；截图保留真实页面效果。两组页面均无运行错误。

诊断材料保存在本任务产物目录 `C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/`：`button-comparison.json`、`button-cause-check.json`，以及 `button-css-*`、`button-style-*` 的常态、悬停、按下截图。这些是本机诊断材料，验收结论和关键数值也在下文保留，不以该临时目录长期存在为前提。

# 为什么连按钮的形态都不同

## tone 覆盖了 variant，却没有恢复组合配方

Button 的组件协议仍然区分两件事：variant 决定动作声量与呈现形态，tone 决定动作语气。旧 CSS 显式处理它们的交集；当前 TS 的通用 tone Rule 位于 variant 后面，却只保留了 `solid + tone + disabled` 的文字特例。

| 组合 | 旧 CSS 的完整行为 | 当前 TS 的行为及后果 |
| --- | --- | --- |
| `solid + accent/danger` | 语气主色实底，配对应前景色；hover 与 active 调整实底 | 后面的 `[data-tone]` 改成淡语气底，tone 规则加淡边框；实心变成浅底描边 |
| `bare + accent/danger` | 常态透明，hover 才出现轻量底色，全程无阴影 | 常态被通用 tone 底色和边框覆盖；hover 又可能被 bare 的更高优先级交互底色覆盖 |
| 默认形态 + tone | 淡语气底配较强的语气文字，hover/active 仍保留强语气文字 | 常态用语气主色文字，hover/active 改用面向实底的前景色；亮色主题出现浅底白字 |
| 禁用的 `solid + tone` | 由原实底和原文字分别淡化，仍看得出原语气 | 背景统一变成 `surface`，亮色下特例仍保留白字，再整体透明，接近不可见 |

Example 的 Accent、Danger 行实际是 `solid + tone`。因此截图中的浅蓝、浅红按钮不是“同一实心按钮的色差”，而是实心配方已经没有生效。

改变 tone Rule 的先后顺序不能完整修复。让 solid 永远后覆盖会丢失语气实底，让 tone 永远后覆盖会丢失实心形态；必须显式恢复组合配方，并把背景与文字作为一对设计。

## 鼠标按下与键盘按下竟然得到不同外观

当前预置条件的 hover、active 都只有伪类本身被 `:where()` 包住，禁用排除条件仍然提高选择器优先级：

```css
&:where(:hover):not(:disabled, [data-status~="disabled"])
&:where(:active):not(:disabled, [data-status~="disabled"])
```

编译器为状态派生生成 hover 与 active 的交集。鼠标按住按钮时，两者同时成立，通用 `.Button` 规则叠加两次 `:not(...)`，优先级达到 `(0,3,0)`，超过 `.Button[data-variant="solid"]` 的 `(0,2,0)`。于是通用文字、阴影重新覆盖 Solid。

| 亮色 Solid 的真实操作 | 旧 CSS | 当前 TS |
| --- | --- | --- |
| 鼠标 hover 后按住 | 白字、无阴影、下移 1px | 深色文字、无阴影、下移 1px |
| 鼠标移开，键盘空格按住 | 白字、无阴影、下移 1px | 白字、仍有常态抬升阴影、下移 1px |

这是级联问题，不是事件没触发。实测两次按下都匹配 `:active`；差异来自鼠标额外匹配 `:hover`。

为验证因果，只在浏览器内把禁用排除条件也包进 `:where()`，其他生成内容不变：鼠标按下恢复白字，但常态抬升阴影也重新出现。这说明两件事分别需要修复：

1. 通用状态条件不应因为交集增加权重而反过来压过组件变体。
2. Solid 本身缺少明确的 active 无阴影配方；当前鼠标下“恰好无阴影”来自错误覆盖，不能当成正确实现保留。

预置条件的代码落在 [selectors/interaction.ts](../../src/style-system/selectors/interaction.ts)。目前没有证据要求重写编译器的交集生成；交集本身是必要能力，不能靠删除交集或提高 Button 选择器权重掩盖问题。

## 圆角形状与父布局约束没有迁移完整

旧 CSS 同时声明 `border-radius: 999px` 和 `corner-shape: squircle`。新版只留下 radius，因此从连续方圆角变成胶囊；保留同一个 radius 数字并不等于保留形状。当前浏览器分别计算为 `superellipse(2)` 与 `superellipse(1)`。

内部布局也从 `inline-flex` 变成 `inline-grid`，同时丢失 `align-self: center`。把按钮放进高 120px、默认拉伸子项的横向 flex 容器，实测：

| 样式 | 按钮实际高度 | 距容器顶部 | 结果 |
| --- | --- | --- | --- |
| 旧 CSS | 48px | 36px | 保持自身高度并居中 |
| 当前 TS | 120px | 0px | 被父容器拉伸 |

拉伸主要由外部对齐约束缺失造成，不能只把 grid 改回 flex 就宣称修好。Example 普通文本没有暴露所有内部排版差异；未来还应验证图标加文字、长文本与窄容器，不把所有 grid/flex 差异一概当成已证实的缺陷。

# 为什么颜色与 hover 感受不同

## 材料换了公式，也换了可覆盖的来源

当前材料并不是旧 token 的等价 TS 表达。例如 [tone.ts](../../src/style-system/values/materials/color/tone.ts) 把 accent 定义为品牌色 80% 与 CSS `cyan` 混色；旧色元则从品牌色调整亮度、色度、色相。两者不能通过相同变量名获得相同结果。

| 项目 | 旧来源或公式 | 当前来源或公式 |
| --- | --- | --- |
| 亮色 accent 主色 | 默认种子下为 `oklch(62% 0.21 242)` | 品牌色 80% 与 cyan 混色 |
| 亮色 danger 主色 | 状态种子、品牌色、强前景色按 94:3:3 调和 | 直接取色板里的危险色 |
| 普通 tone 的背景 | 中性第 1/2/3 档分别混 soft tone，比例 76%/68%/58% | 三态均使用同一个 surface，比例 76%/66%/56% |
| soft accent | 明暗主题分别使用旧 token 的 14%/20% alpha | 固定 14% alpha |
| Solid 常态文字 | 动作前景色 90% 与常态底色混合 | 直接使用动作前景色 |
| Solid hover 背景 | 对动作色做 OKLCH 通道调整 | 动作色 90% 与明暗 shade 混合 |
| Solid active 背景 | 对动作色做另一组通道调整 | 动作色 80% 与黑色混合 |

亮色 Solid 的常态色恰好相同，不能据此判断材料等价。实测旧 hover 为 `oklch(0.54 0.21 260)`，新 hover 的 OKLab 结果等价于约 `oklch(0.522 0.18 260)`；旧 active 为 `oklch(0.50 0.19 260)`，新 active 约为 `oklch(0.464 0.16 260)`。新版更暗，色度还同时降低。暗色 hover 的亮度也从旧版 0.75 变为新版约 0.73，active 从 0.64 变为约 0.56。

更重要的是，旧 `[--base-brand → 色元 → 语义颜色]` 路径被新材料的固定色板绕过。[palette.ts](../../src/style-system/values/materials/color/palette.ts) 等材料通过 `root` 发出未分层的根变量定义，其中包含与原 token 同名的 `--color-brand`、`--color-accent` 等。它们会覆盖 `@layer tokens` 中的定义，不只影响 Button，也可能影响其他读取这些变量的界面。

验证时把根元素 `--base-brand` 改成 `oklch(60% 0.15 140)`：旧 Solid 实底随之变绿，当前 TS 仍为 `oklch(58% 0.2 260)`。这是品牌色控制路径失效，不是主观色差。

## 阴影、边框与禁用方式进一步改变观感

旧默认按钮的阴影是第 1 档 → 第 2 档 → 无；旧 Solid 是第 2 档 → 第 3 档 → 无。当前 Solid 只选了 `raised`，没有更高 hover 档与明确 active 平面档。新版暗色阴影也沿用亮色几何和 3% 接触阴影，旧暗色第 2 档却有 46% 接触阴影及更大的扩散范围。

旧按钮边框一直透明，只占据 1px 几何空间。新版默认边框使用 `softLine`，tone 使用 soft tone。新增可见边界、淡背景和较弱阴影叠加后，视觉重量整体改变。

禁用必须比较完整应用，而不是只比较组件文件：旧 `Button.css` 把常态背景按 48% 混入中性第 2 档，把常态文字按 48% 混入透明；[controls.css](../../src/css/controls.css) 再为原生禁用按钮施加整体 `opacity: 0.56`。当前 TS 改为统一 surface、普通前景或组合特例前景，再由 `clickable()` 施加整体 `opacity: 0.48`。颜色配对、保留语气的方式、整体透明度三项都变了。

## 不是所有地方都有退化

本次对照中，四档最小高度仍为 32/48/64/80px，字号、间距、内边距数值一致；常规过渡仍是 120ms 和同一缓动曲线，减少动效时两组均为 0s。loading 都显示进度指针，loading 与 disabled 同时存在时均为禁止指针。

这些一致项应继续保持，不应为了恢复颜色和组合外观重新设计尺寸或 loading 行为。

# 差异从哪里进入，为什么测试没有拦住

| 提交 | 可从差异直接确认的变化 |
| --- | --- |
| `2653ad7`，09-03 | 首次 CSS → TS 迁移仍保留旧配方，包括方圆角、组合规则与禁用混色；不能把今天的差异归咎于使用 TS 本身 |
| `4d27145`，09-05 | 重写为样式系统时改动基础配色、边框和禁用策略，移除方圆角声明；这已不是纯组织调整 |
| `3957213`，09-05 | 删去 `solidToneBlocks` 等组合背景与状态配方，solid + tone 缩成文字覆盖，丢失实心语气组合的完整定义 |
| `715a051`，09-14 | Example 移除模拟 hover/active 的类与外壳，改为真实体验；这解释展示方式变化，但不解释实测交互错误 |
| `f89784a`，09-17 | solid + tone 的文字特殊处理进一步缩到 disabled，形成当前浅底白字的组合问题之一 |

状态交集的优先级问题已在当前产物中复现，但本次没有对每次编译器历史提交做二分定位，不把它的首次引入时间归到某个未经验证的提交。

[现有 Button 浏览器测试](../../src/components/kits/Button/button.browser.test.tsx) 主要证明“几类背景互不相同”“hover 会改变颜色”“禁用统一为 surface、opacity 0.48”。这些断言与当前实现一致，却不能证明与旧视觉一致，有的已经固定了本次要纠正的行为。

目前缺少四类验收：完整 variant × tone 的配对结果、启用态鼠标与键盘的交集一致性、品牌色覆盖路径、形状与外部布局约束。测试中检查到了 `border-radius: 999px`，却没有检查 `corner-shape`；检查到了 `min-height: 48px`，却没有检查在拉伸容器中的实际高度。测试通过不等于“骨架保住了”。

# 恢复目标与职责边界

目标是让 `Button.style.ts` 重新表达指定旧版的视觉与交互，而不是让 Button 永久依赖两份样式叠加。基准包括明暗主题、品牌色定制、外部 layer 覆盖及实际交互，不只包括截图中的常态颜色。

职责保持为：Button 负责 variant/tone/size/status 的业务配方；材料负责可复用的颜色与阴影；Mixin 负责完整的边界、布局、可点击效果；预置 Condition 负责状态匹配及其默认优先级。编译器不认识 Button，也不补写 Button 漏掉的配方。

## 应恢复的背景配方

下表是后续实现的核对表，不要求把旧 CSS 的每个槽位机械复制成一个 TS Variable。所有混色仍用 OKLab；“比例”表示前一颜色所占比例。中性 1/2/3 指 `--dye-neutral-1/2/3`，soft tone 指当前 tone 对应的低浓度语气色。

| 配方 | 常态背景 | hover 背景 | active 背景 |
| --- | --- | --- | --- |
| 默认 | 中性 1 的 82% + soft accent | 中性 2 的 72% + soft accent | 中性 3 的 62% + soft accent |
| bare | 透明 | 中性 1 的 88% + soft accent | 中性 2 的 82% + soft accent |
| solid | action | action-hover | action-active |
| 默认 + tone | 中性 1 的 76% + soft tone | 中性 2 的 68% + soft tone | 中性 3 的 58% + soft tone |
| bare + tone | 透明 | 中性 1 的 82% + soft tone | 中性 2 的 74% + soft tone |
| solid + tone | tone 主色 | tone 主色 88% + 强前景 | tone 主色 78% + 强前景 |

文字、焦点与阴影要随配方一起恢复：

- 默认和 bare 使用普通前景，hover/active 使用强前景；非实心 tone 三态均使用强语气前景。
- solid 常态文字为对应实底前景 90% 与常态背景混色，hover/active 使用对应实底前景。accent 的强语气文字与实底前景是两种不同材料，不应合并成一个 `toneForeground`。
- 默认焦点使用 accent-focus，普通 solid 使用 action-line，带 tone 时使用对应 tone 的焦点或边界色；宽度、偏移仍为 2px。
- 默认阴影为 1 → 2 → 0，solid 为 2 → 3 → 0，bare 三态均无阴影；所有边框透明。
- 禁用从该组合的**常态**背景和常态文字派生，而不是从 hover/active 当前值派生；移除阴影、位移，禁止交互反馈。原生 Button 的整体透明度以实测旧值 0.56 为基准。

## 颜色材料采用一个权威来源

推荐候选是复用项目已有的 `src/css/tokens/*` 定义。TS 材料用 `variable(name)` 引用这些语义 token，不再为同名 token 另发一套 `root` 配色；Button 仍然完全用 Style System 声明自身样式，不导入旧 Button CSS。**这项建议必须通过 W4 的消费者监察和 W7 的所有权裁决，不能直接全局替换材料。**

这不是增加旧版兼容模式，而是消除当前已同时存在的两套颜色真相。当前应用和 Storybook 本来就引入 `all-base.css`；采用这一方案后，材料模块应明确它消费该基础样式的约定，测试入口也应加载同一套基础样式。

主要对应关系如下，TS 导出名可保持业务可读性，不需要等于 CSS 变量拼写：

| 材料职责 | 本次推荐读取的现有 token |
| --- | --- |
| 品牌与中性色元 | `--color-brand`、`--dye-neutral-*` |
| 动作三态与实底前景 | `--color-action`、`--color-action-hover`、`--color-action-active`、`--color-action-fg` |
| 普通与强文字 | `--color-fg`、`--color-fg-strong` |
| accent 各角色 | `--color-accent`、`--color-accent-soft`、`--color-accent-strong`、`--color-accent-fg`、`--color-accent-focus` |
| danger 各角色 | `--color-bad`、`--color-bad-soft`、`--color-bad-fg`、`--color-bad-line` |
| 阴影四档 | `--shadow-0/1/2/3` |

Button 的候选修复是不再把通用 `toneSurface` 当成所有 variant 的共同表面，也不再采用黑白混色版 `actionSurface`。优先调整 Button 的消费与配方；若需要改共享导出的定义，先完成消费者清单与影响裁决。不能删除或重定义其他消费者仍在使用的材料，也不能表面改用旧变量，实际仍被新根变量覆盖。

如果要求 Style System 脱离基础 CSS 也独立提供全部颜色，应另行选择完整 token 迁移：用已有 `cssFunction()`、相对 OKLCH 表达式、主题 Condition 等逐项等价移植，并让旧基础入口消费同一个定义源。不能把完整色彩体系迁移偷偷塞进 Button 配方修复，也不能把近似混色称为等价实现。

# Style System 哪些已有，哪些需要补

| 能力或缺陷 | 当前判断 | 建议落点与做法 |
| --- | --- | --- |
| variant × tone 组合 | 已支持普通复合选择器 | `Button.style.ts` 直接恢复组合 Rule，不建 Button 私有框架 |
| hover/active/disabled 派生 | 已支持；预置条件权重有问题 | `selectors/interaction.ts` 将 hover/active 的完整状态判断放进 `:where()`，保留原生与标记禁用排除 |
| `@layer uikit` | 已支持普通 Condition；当前组件未使用 | Button 各 Rule 地址统一带 `@layer uikit` 前缀，不新增编译器 layer 分支 |
| `corner-shape` | 原始 Key 已支持；boundary 未暴露 | 在 `properties/border.ts` 增加 `$cornerShape`，`boundary()` 增加可选 `cornerShape`，Button 选择 `squircle` |
| 内部 flex 居中 | CSS Key 已有；`contentLayout` 当前 center 固定 grid | 给内容布局补明确的 flex 居中排列模式，由 Mixin 发出 `inline-flex`、内容居中；保留已有模式，避免默改其他消费者 |
| 主体在父容器内居中 | 已有 `$alignSelf`，当前 Button 未声明 | Button 使用现有 Key 恢复 `align-self: center`；它不是内部内容布局，不塞进 `contentLayout` |
| 禁用透明度选择 | `clickable()` 写死材料 0.48 | 增加可选 `opacity: ValueInput` 参数，默认保持现有策略；Button 明确选择常态 1、禁用 0.56，不用后置重置 Rule 抵消 Mixin |
| 完整前景角色、焦点色与高档阴影 | 材料不全或来源不等价，不是编译能力缺失 | 在对应 color、shadow 材料中补角色并复用原 token，不让 Button 硬编码一套色板 |
| 精确颜色函数与主题派生 | 核心已有表达与依赖机制 | 本次优先引用既有 token；只有决定迁移 token 所有权后才搬公式，不增加 Button 专属编译逻辑 |

本轮已用最小编译探针验证 `rules(['@layer uikit', '.probe'], [[key('corner-shape'), 'squircle']])` 能生成正确的 layer 和声明。因此“Style System 不支持方圆角或 layer”不成立；缺的是组件选用及领域入口。

外部 layer 的区别也经过验证：添加一个后置 `@layer comparison` 的 `.Button { color: rgb(1,2,3) }`，旧版允许覆盖，当前未分层的 TS 样式则压过它。组件恢复 `uikit` layer 后，还要检查材料根定义是否仍从未分层位置影响全局。

# 实施顺序与文件落点

以下 21 个编号都是独立监察点，本次均已有满足证据；各行保留原完成判据与停止线。前文诊断数据只证明问题存在，修复结果以本表和末节接入后验收记录为准。测试编号在“测试落点与执行方式”中定义。

每项执行后更新该行“状态与实际证据”：`状态；实现文件:行号；用例名；运行结果位置；验证时的提交/工作区版本；未满足原因`。手工范围审计等无自动用例的检查，记录具体差异与核对结论。状态采用 R2 的“满足 / 未满足 / 有依据不适用”；未验证属于未满足。记录不适用时必须附需求或事实依据，不得以工作量大、环境没配好代替依据。

各阶段都继承 W1—W8；表中“停止线”强调该点最容易越界的位置。先完成第 0 阶段；第 1—3 阶段只在各自前提满足后进行；第 4 阶段依赖所消费能力通过；5.1 通过后才允许 5.2 切换，5.3 接入后验收通过才允许交付。

## 0. 冻结范围、基准与保护项

依据 R1、R2、R5、R6。这一阶段不修改实现，只补本文中的执行记录与获准测试。

| 监察点与动作 | 怎样判定完成，证据在哪里 | 停止线 | 状态与实际证据 |
| --- | --- | --- | --- |
| 0.1 确认未来实施授权与工作区归属 | 记录用户授权原文、开始时 Git 状态及已有差异；列出拟改文件与监察编号；每个新增改动都能追到原要求。证据留本文执行记录 | 只有“修补文档”授权时不可开工；不能把现有暂存内容当作自己的改动或清理对象 | 满足；授权及暂存归属见末节实施记录；新增差异均限定于所列文件与监察编号 |
| 0.2 固定对照与测试隔离 | T1 同时验证 CSS 基准对象、基础样式和两组有效样式来源。暂时移除被测 TS 样式后，测试必须失败，证明不是旧 CSS 替它通过 | 基准变化、两套样式同时命中、TS 未实际生效时，全部对照结论无效 | 满足；T1 Git blob 校验及停用 TS 负对照通过；基础样式先加载，历史样式仅命中 BaselineButton |
| 0.3 建立不回归清单 | T5、T6 记录尺寸、布局内容、动效、loading、原生属性、点击与挂载基线；T4 列出共享导入者及变量消费者。区分“待修复的已知差异”和“必须保持的既有行为” | 未取得共享影响范围，不得改材料或 Mixin 默认行为；原有失败单列，不扩大范围修它 | 满足；T4 消费者清单与前后探针、T5 几何及动效、T6 原契约通过；基线 4 个 Button 失败单列 |

## 1. 修正预置交互条件，不动编译机制

依据 R2、R3、R7。源码只涉及 [selectors/interaction.ts](../../src/style-system/selectors/interaction.ts) 的 hover/active 判断；测试落在 T2。

| 监察点与动作 | 怎样判定完成，证据在哪里 | 停止线 | 状态与实际证据 |
| --- | --- | --- | --- |
| 1.1 降低完整 hover/active 条件的权重 | 最小探针在修改前复现“鼠标按下压过变体”，修改后不再覆盖；T2 分别确认 hover、active、两者同时命中时，更具体的变体声明保持有效 | 不能删交集、加权 Button、改 focus/disabled 的权重，或重写 Subject Condition 顺序来凑结果 | 满足；T2 修改前真实交集得到绿色而非白色，修正后 hover / active / 交集均白色；3 用例通过 |
| 1.2 保留禁用排除与普通 Condition 语义 | T2 用原生禁用、标记禁用、两者并存证明 hover/active 条件均不匹配；普通自定义选择器和 focus/focus-within 的既有用例仍通过 | 修优先级不能让禁用进入交互；不能把所有用户选择器自动改成零权重 | 满足；T2 三来源禁用、focus / focus-within；59 个聚焦单元覆盖普通 Condition 与原交集语义 |

## 2. 恢复颜色和阴影，先约束共享影响

依据 R1—R5。候选落点是 [palette.ts](../../src/style-system/values/materials/color/palette.ts)、[action.ts](../../src/style-system/values/materials/color/action.ts)、[text.ts](../../src/style-system/values/materials/color/text.ts)、[tone.ts](../../src/style-system/values/materials/color/tone.ts)、[shadow.ts](../../src/style-system/values/materials/shadow.ts) 中被 Button 消费的材料；目录和其余导出不是整体迁移范围。

| 监察点与动作 | 怎样判定完成，证据在哪里 | 停止线 | 状态与实际证据 |
| --- | --- | --- | --- |
| 2.1 裁定材料来源与消费者影响 | 完成 0.3 清单，逐一列出拟变更导出的当前/目标含义、根变量及受影响消费者；记录末节材料所有权裁决；T4 给出非 Button 探针的修改前基线 | 新增基础 CSS 依赖、改消费者协议或造成范围外外观变化不能默认获准；共享方案碰壁时先报告，不批量迁移消费者 | 满足；用户批准基础 token 依赖；导出与消费者清单见实施记录；T4 挂载前后非 Button 探针一致 |
| 2.2 恢复颜色材料的数值与覆盖路径 | T4 在明暗主题核对 action 三态、accent 各角色、danger 各角色、普通与强前景的值和 alpha；亮色 `--base-brand` 覆盖跟随基准，暗色保持原定义；T4 的非 Button 保护项不回归 | 禁止近似公式替代等价表达，禁止修改原 token 让两组数值相同；无法避免全局副作用时该项未完成 | 满足；T4 两主题、默认及绿色品牌输入下 16 组颜色材料逐项等价；亮色动作变绿，暗色维持原定义 |
| 2.3 恢复四档阴影材料 | T4 分别比较明暗主题的阴影层数、偏移、模糊、颜色和 alpha，四档均与原 token 等价；范围外既有材料契约保持 | 不能只补亮色或只改 Button 截图，也不能把共享 `raised` 的所有消费者顺便改成新视觉 | 满足；T4 shadow-0 至 shadow-3 两主题计算阴影精确相同；无其他生产 TS 消费者 |

## 3. 补齐效果配置，保持旧调用行为

依据 R3、R4、R7。每个新参数分别写明“不提供它会缺少什么能力”；新增 API 必须由 T3 证明输出，不允许为排版整齐抽取私有包装。

| 监察点与源码落点 | 怎样判定完成，证据在哪里 | 停止线 | 状态与实际证据 |
| --- | --- | --- | --- |
| 3.1 方圆角：[border.ts](../../src/style-system/properties/border.ts)、[structure.ts](../../src/style-system/mixins/structure.ts) | T3 证明 `boundary` 选择 squircle 时输出对应声明，省略时不新增该属性；T5 实际计算形状正确，旧边框/outline 配置输出不变 | 不改变已有 radius 默认，不加浏览器兼容层，不替所有组件开启 squircle | 满足；T3 选用 / 省略与边框 outline 保护通过；T5 实际 corner-shape 为 superellipse(2) |
| 3.2 flex 居中：[content.ts](../../src/style-system/mixins/content.ts) | T3 新排列模式输出 inline-flex 与内容居中；旧 center 模式、仅 padding/gap 调用的输出保持；T5 验证图标文字间距与长文本 | 不把现有 center 的 grid 行为全局替换；父布局 align-self 不混入内部布局 Mixin | 满足；T3 旧 center 仍 grid，新 flex-center 输出 flex；T5 四尺寸三内容场景及间距通过 |
| 3.3 可选透明度：[interaction.ts](../../src/style-system/mixins/interaction.ts) | T3 证明显式 opacity Value 生效，无参数调用仍输出原有策略；T5 验证 Button 原生禁用为 0.56，过渡、光标、位移功能不丢 | 不能直接把共享 disabledFade 全局改成 0.56；标记禁用分支须有 W7 裁决 | 满足；T3 无参仍 0.48，显式 0.56；T1 原生 / 标记 / 并存均 0.56 且不进入交互 |

## 4. 恢复 Button 的每一类配方

依据 R2、R3、R7。所有业务修改只落在 [Button.style.ts](../../src/components/kits/Button/Button.style.ts)，通用能力通过前述入口使用；T1、T5 在真实 Button 上验证。第 4 阶段不改 `Button.tsx` 的业务代码。

| 监察点与动作 | 怎样判定完成，证据在哪里 | 停止线 | 状态与实际证据 |
| --- | --- | --- | --- |
| 4.1 默认、bare、solid 三种无 tone 配方 | T1 两主题三态的背景和文字符合配方表；bare 常态透明且无阴影；默认阴影 1→2→0、solid 2→3→0；边框透明 | 不能仅断言三个颜色不同；不能把通用状态偶然覆盖得到的结果当作 Solid 自身配方 | 满足；T1 两主题九配方精确对照；实际页面 36 组、180 状态数值通过 |
| 4.2 普通形态的 accent、danger | T1 核对 76/68/58 配比与中性 1/2/3 输入，三态文字均为对应强语气色；颜色及 alpha 与基准一致 | 不把面向实底的前景色用在淡背景上，不把三态中性表面合成一个 surface | 满足；T1 同上，普通 tone 三态强文字与 76/68/58 配方均与固定 CSS 等价 |
| 4.3 bare + tone、solid + tone | T1 对两种 tone 分别验证：bare 常态透明、hover/active 为 82/74 配方；solid 为主色实底、88/78 配方及匹配前景。T5 对比真实 hover/active 截图 | 不能只换 Rule 顺序或只补文字；不能让 tone 改变 variant 的呈现形态 | 满足；T1 组合三态精确等价；隔离页面明暗 rest / hover / active 共 12 张截图已保存 |
| 4.4 禁用配方及 loading 交集 | T1 从各组合常态背景/文字计算 48% 混色；三种禁用来源按已裁决目标验证，hover/active 后颜色稳定、无阴影/位移，loading 交集为禁止指针 | 不引用正在派生的当前背景形成循环；不从 hover 色计算 disabled；标记行为未裁决不能勾选通过 | 满足；T1 两主题全尺寸 loading 禁用矩阵与九配方三禁用交集通过；标记语义按用户裁决 |
| 4.5 焦点与输入方式 | T5 用键盘取得真实 focus-visible，逐类核对焦点颜色、2px 宽度和偏移；鼠标按住与鼠标移开后空格按住的主体颜色、阴影、位移一致 | 不能用模拟 class 替代真实状态，也不能为了配色一致删除键盘焦点提示 | 满足；T1 九配方两主题键盘 focus-visible 与旧焦点环一致；实际页面鼠标 / 空格 active 主体结果逐项一致 |
| 4.6 形状、外部对齐及尺寸保护 | T5 证明 squircle、align-self 居中；120px 横向拉伸容器中默认按钮高 48px、顶部偏移 36px；四档尺寸、字号、padding/gap 和内容场景均符合基准 | 不能只改 display 后宣称布局恢复；不能调小字号或尺寸掩盖排版问题 | 满足；T5 四尺寸×三内容、方圆角、透明边框通过；120px 父容器内高 48px、顶部偏移 36px |
| 4.7 layer 与按需依赖 | T3 确认所有 Button 地址在 uikit 层，T5 验证后置 layer 可覆盖；T4 确认未激活不相关根材料，未用未分层变量改变保护项 | 不改全局 layer 顺序，不加 important，不把整个 CSSRoot 包进 uikit 层 | 满足；T5 CSSOM 所有 Button 地址在 uikit，后置 layer 可覆盖；T4 无颜色或阴影根覆盖 |

Button 的禁用公式需要常态颜色作为输入。若必须引入组件 Variable，应记录它具体被哪些派生消费；不能将全部 CSS 属性机械镜像成私有 Variable。声明结构先通过 T3 的最小编译与 T1 的浏览器检查，再铺开其他组合。

## 5. 逐项复核后切入口，再验实际入口

依据 R1、R4、R6。允许的生产入口变化仅为 `Button.tsx` 的一处样式 import；[.storybook/preview.ts](../../.storybook/preview.ts) 先只读核查，发现必须修改时先补充必要性与范围裁决，不能顺手清理。

| 监察点与动作 | 怎样判定完成，证据在哪里 | 停止线 | 状态与实际证据 |
| --- | --- | --- | --- |
| 5.1 切换前监察 | 0—4 的每个小项都有通过证据，T1—T5 及 T6 的切换前部分完成；完整差异逐块对应编号；W3/W4 保护项无新增回归；R3/R4 要求的可读性、可维护性及责任检查有具体结论 | 任一前置项未满足、未验证或未决，都不能提前切换正式 import；测试全绿不能豁免越界差异 | 满足；01:35 切换前类型退出 0、单元 160/160、浏览器 55/55；隔离实际页面通过；范围和质量审计见实施记录 |
| 5.2 单 import 接入 | 获准后仅切回 `./Button.style`；T6 在实际 Example 和 Storybook 检查有效样式来源、首次挂载和重复渲染，旧 CSS 不再参与，只有一套 Button 规则生效 | 不改 props、事件、DOM 或启动机制；不删历史 CSS；若双重来源仍存在，不能用截图宣布完成 | 满足；Button.tsx 仅改 import；Example 仅一个 css-root、没有 Button.css；Storybook 静态产物及库消费预览通过，重复渲染不新增规则 |
| 5.3 接入后最终验收 | 重跑 T1—T6 与全量检查；保存同场景截图、运行版本和退出码；按编号更新状态并给出逐块职责说明。W1/W2 差异审计确认只有获准改动 | 接入后的代码变化使旧证据失效时必须重测；不把“接入前通过”代替实际入口通过 | 满足；接入后类型、160 单元、55 浏览器、库构建及 Storybook 构建均退出 0；六对截图哈希一致，构建预览无页面错误；最终范围审计见末节 |

每次发现问题先定位属于哪个编号，再修该项并重查受影响项。已经通过且输入、实现和环境均未变化的证据可以复用；没有影响依据，不重开无关实现。确属范围外的问题只记录，不作为附带任务执行。

# 最小验收与完成条件

## 测试落点与执行方式

以下定义测试职责，实际覆盖与运行结果见监察表及接入后记录。新增用例优先进入表内已有文件；只有这些文件无法承担对应职责时，才提出具体的新测试文件和理由，不顺便重组测试目录。涉及测试基准的改写必须记录原断言、需求依据、新断言及对应监察编号。

| 测试编号与具体落点 | 要留下的长期回归证据 | 对应监察点 |
| --- | --- | --- |
| T1：`src/components/kits/Button/button.browser.test.tsx` 的隔离对照、配方矩阵用例 | 真实 props 渲染 3 variant × 3 tone × 2 主题，记录背景/文字/边框/阴影；真实 hover、鼠标 active、键盘 active、三类禁用来源及 loading 交集。旧公式是独立期望，不能从待测材料直接读取并当作答案；移除 TS 样式的负对照须失败 | 0.2、4.1—4.4 |
| T2：`src/style-system/selectors/interaction.browser.test.ts`；现有 `compiler/subject-condition.test.ts`、`compiler/subject-condition-composition.test.ts` 回归 | 通用状态与更具体变体在同时 hover+active 时仍正确覆盖；禁用排除不变；普通自定义 Condition 保持原义。编译器测试只调整与获准 selector 文本变化直接对应的期望，其他语义不改 | 1.1、1.2 |
| T3：`src/style-system/compiler/compile-css.test.ts` 的 Mixin 与条件输出用例 | boundary 新字段选用/省略；contentLayout 新模式与旧模式；clickable 显式 opacity 与无参数旧默认；Button layer 地址及常态颜色派生无循环。每个新配置有正例和省略配置的保护例 | 3.1—3.3、4.7，以及 4.1—4.4 的声明表达 |
| T4：`src/components/kits/Button/button.browser.test.tsx` 的材料消费与非 Button 探针用例 | 固定旧 token 输入下的明暗数值、品牌覆盖、alpha 和四档阴影；同页非 Button 元素读取受影响共享变量，按 0.3 消费者清单验证既有约定，不只看 Button。涉及真实其他组件时优先运行其现有测试，不修改其实现或期望 | 0.3、2.1—2.3、4.7 |
| T5：`src/components/kits/Button/button.browser.test.tsx` 的交互、几何、保护用例及实际页面截图 | 核对 4.5—4.7 与下表的实际计算值；四尺寸的文字、图标文字、长文本、窄容器；真实焦点、鼠标与键盘、120px 父容器、减少动效和 loading。截图注明主题、输入动作、视口与版本 | 0.3、3.1—3.3、4.3、4.5—4.7 |
| T6：`src/components/kits/Button/Button.test.tsx`、`button.browser.test.tsx`、`src/style-system/core/css-root.browser.test.ts` 的原有契约回归，以及实际 Example/Storybook 入口检查 | 切换前：组件协议既有测试不回归，在隔离 TS 场景验证只登记、统一挂载及重复渲染不新增规则。切换后：真实入口只加载 TS，CSSRoot 仍按原方式启动，截图结果与隔离场景一致；构建产物与预览入口也通过 | 0.3、5.1—5.3 |

T2、T3 的精确单元用例新增或调整属于对应能力的验收；不授权修改编译器实现。T6 的组件协议与 CSSRoot 既有用例原则上保持原断言；若发现与本次目标直接冲突，先列出冲突及裁决依据，不能批量更新快照。

每次运行记录命令、运行版本、退出码、失败用例及结果文件位置。测试代码要进入获准仓库位置，截图和运行结果放任务产物目录；只留一次临时脚本输出不能替代长期回归测试。后续改动影响某项输入、实现或环境时，该项旧通过证据失效，须重跑。

## 浏览器验收

| 检查范围 | 必须证明的结果 |
| --- | --- |
| 明暗主题 × 三种 variant × 三种 tone | 常态、hover、active 的背景、文字、边框、阴影与基准配方一致；solid 仍是实底，bare 常态仍透明 |
| 鼠标按住与键盘空格按住 | 两种操作均进入 active；除焦点指示差异外，颜色、阴影、位移一致，不受额外 hover 反向覆盖 |
| 原生 disabled、标记 disabled、两者并存 | 禁用配方稳定，hover/active 不改变它；loading 交集仍为禁止指针；仅标记场景的取舍见下一节 |
| 焦点与状态交集 | 普通、solid、tone 使用各自正确的焦点颜色，宽度和偏移不丢失；focus-visible 不改变主体配方 |
| 四种尺寸与内容布局 | 数值维持原档位；包含文字、图标与文字、长文本；120px 拉伸容器中默认按钮仍为 48px 且居中 |
| 方圆角与边框 | `corner-shape` 生效，边框透明；不能只检查 radius 数字 |
| 品牌与主题覆盖 | 亮色主题修改 `--base-brand` 后动作色及派生继续更新；明暗切换遵循原 token 的各自定义，不擅自把旧暗色固定配方改成品牌派生；无未分层的同名新色板压过原 token |
| 层级与动效 | 外部后置 layer 仍可覆盖；减少动效为 0s；正常过渡与 loading 行为保持 |

同一浏览器、同一背景与同一主题下比较计算值和截图。颜色允许浏览器序列化形式不同，但需要归一后数值等价；不先放宽容差来吸收配方错误。半透明颜色同时比较 alpha、元素 opacity 与最终截图，不能只取 RGB。

恢复过程中的测试应先在当前 TS 上复现已知失败，再在修复后通过，避免写成新实现的自我证明。现有“禁用统一 surface、0.48、solid + tone 白字”等断言必须按确认后的目标改写，而不是为维持旧测试通过保留视觉错误。

## 自动检查与人工交付

实施过程中先按文件运行受影响的测试；在切换前监察和接入后最终验收两个时点，均必须运行类型检查、完整单元测试与完整浏览器测试。不得以聚焦运行代替这两个时点的完整运行。

```text
bun run type-check
bun run test:unit
bun run test:browser
```

聚焦运行的现有入口为 `bun run test:unit -- <测试文件>` 与 `bun run test:browser -- <测试文件>`，文件取自 T1—T6。不为执行这些检查修改测试配置、依赖或浏览器范围；环境阻塞时先排查现有配置，记录受阻项，不能记为通过。

5.2 必然改变样式入口，因此 5.3 必须额外执行 `bun run build`、`bun run build-storybook`，并打开对应预览验证有效样式来源和真实交互。构建失败时区分原有失败与本次引入的失败；前者不能顺带修复，也不能隐去后宣称全量通过。

测试命令通过只证明其覆盖范围，不能替代实际交互、共享影响和范围审计。交付前复核 `git diff` 与暂存区，确认本次没有混入其他用户改动，也没有改动只读基准。

最终交付应包含两份样式在相同场景的常态、hover、active 截图，以及明暗主题和鼠标/键盘交互的对照结论。实施说明按 Button 配方、材料、Mixin、预置条件四块解释真实改动，并确认只剩一套有效运行入口。

# 裁决记录与明确不做的事

2026-09-19：用户明确批准基础 CSS 材料来源及标记禁用方案，已无待裁决项；保护其他消费者的 W4 继续有效。

## 实施记录

- 开始版本：`9d8ba455f4e3ea122bf7124f46cf8773d2cb6352`。用户已有暂存：本文、恢复的 `Button.css`、`Button.tsx` 的 CSS import；不改暂存区。
- 基线：类型检查退出 0；单元 29 文件、157 测试通过；浏览器 42 通过、4 个 Button 测试失败（旧测试假定 TS 已登记、缺少完整基础样式，并断言旧 TS 的禁用目标）。测试生成的附件单独保留，不纳入实现改动。
- 拟改范围：T1—T3 指定测试；1.1 的交互预置；2.1 列出的被消费材料；3.1—3.3 的属性与 Mixin；4.1—4.7 的 Button 样式；5.2 的单 import；本文状态证据。不改编译器实现及只读基准。
- 修改前反例：T2 新增真实浏览器用例“hover 与 active 的交集不增加权重压过变体”失败，预期白色却得到 `rgb(0, 128, 0)`；两个禁用/焦点保护用例通过。证明修复目标确实由预置条件权重引起。

### 材料范围与责任审计

- 全库生产导入检索：颜色与阴影材料的实际 TS 组件消费者只有 Button。材料内部仍有 `surface`、`toneSurface`、`edge` 等组合引用；本次不迁移这些未激活的配方，也不删除其出口。`palette` 基础色板、`brand`、`ink`、`surface` 及阴影几何等未消费导出保留。
- Button 所用 `lowSurface/hoverSurface/activeSurface` 改为引用 `--dye-neutral-1/2/3`；`foreground/strongForeground` 引用 `--color-fg/--color-fg-strong`；action 角色引用 `--color-action*`；accent 引用 `--color-accent*`；danger 映射 `--color-bad*`；flat/low/raised/elevated 引用 `--shadow-0/1/2/3`。这些材料依赖已加载的基础 CSS，不再为 Button 生成替代色板根定义。入口 `src/index.ts` 与 Storybook 已加载 `all-base.css`，不新增入口机制。
- 静态变量消费者包括 controls、Input、Popover、ExampleDashboard、ExampleHome、Article 与 DragAndDrop 示例。保护基准是本次开工时正在运行的旧 CSS 页面。T4 在 TS 挂载前后读取 16 组颜色、4 档阴影及实际 Input/Popover CSS 探针；两主题与品牌覆盖输入全部一致。未修改这些消费者或它们的测试期望。
- 仅保留两个必要 Button 常态变量：`restSurface` 供常态显示、实心文字调和、禁用底色混合读取；`restForeground` 供常态显示和禁用文字淡化读取。它们不随 hover/active 改变，浏览器验证禁用来源不会意外读取悬停值；没有镜像所有 CSS 属性。
- 结构审计：Button 样式 275 行，按默认、交互、声量、语气组合、尺寸和 loading 定义直接 Rule；3 个 Mixin 分别 68/41/43 行，保持原文件职责和旧默认。无私有 Mixin、编译器分支、全局加权、readonly 或无关重命名。T1 文件 512 行，只负责 Button 的隔离、材料与视觉验收；编译测试 529 行，沿用原位置。其余变更文件 7—113 行，均是各自领域的材料、属性、预置或验收；没有超过 1000 行文件，也没有为本次测试重组目录。
- T1 对旧断言的调整均有目标依据：禁用统一 surface/0.48 改为固定 CSS 常态派生/已批准 0.56；danger 焦点读取旧 bad-line；Button 根规则计数改为 uikit layer 内计数。保留首次挂载、重复挂载、子内容、尺寸、loading 与外部覆盖检查。T2 单元仅随零权重 selector 更新精确文本，未改编译器和 Condition 排序。
- 切换前运行：`bun run type-check` 退出 0；`bun run test:unit` 29 文件、160 测试；`bun run test:browser` 10 文件、55 测试，均退出 0。实际页面脚本 `button-restoration.mjs` 退出 0：Edge 153.0.4234.32，1600×1100，36 组、180 状态，鼠标/键盘一致，减少动效归零。结果在任务产物 `button-restoration-isolated.json`，截图 `restored-isolated-{css,style}-{light,dark}-{rest,hover,active}.png`；人工已核对亮色 hover 对照。

**标记禁用的已批准区别。** 旧 CSS 仅标记 `data-status="disabled"` 时可能出现按压位移，且没有 controls 层的 0.56 透明度。用户已批准统一为 0.56、排除 hover/active 反馈；正常 Button disabled 同时设置原生属性，仍与旧基准一致。此处是显式确认的边缘行为调整，不声称与旧 CSS 逐字等价，也未更改事件插件。

**材料依赖已确认，整套 token 迁移不在范围内。** Button 颜色及阴影消费已有基础 CSS 定义；启动时基础 layer 顺序须位于 css-root 之前，沿用当前 Example 的基础样式 link 和统一挂载结构。库消费测试最初漏了这个顺序，出现 controls 覆盖，按项目现有入口补齐测试宿主后通过；没有因此改动 CSSRoot、构建配置或生产入口结构。将所有材料定义迁入 TS 仍须另行授权。

用户没有要求保留浅底白字、丢失实心、拉伸、胶囊形状或不同调色公式，因此不能把它们直接命名为“设计权衡”。实施只恢复本文范围，不修改公共组件 API、Example 展示结构或其他 Plan；不重写编译器，不添加 `!important`、重复属性选择器或 Button 专属编译分支来压过问题。

## 接入后验收记录

运行版本是上述 HEAD 加本次工作区改动，未创建提交。2026-09-19 01:39 接入后检查：

| 检查 | 实际结果与证据 |
| --- | --- |
| 类型、完整单元、完整浏览器 | `bun run type-check` 退出 0；`bun run test:unit` 160/160；`bun run test:browser` 55/55。测试命令另加 JSON reporter 保存 `button-final-unit.json`、`button-final-browser.json`，没有改测试配置 |
| 构建 | `bun run build`、`bun run build-storybook` 均退出 0。Storybook 有未识别 CSS `@function` 和大 chunk 警告；未修改只读基础 CSS 或构建配置来消除警告，实际静态页面颜色与交互检查通过 |
| 实际 Example | `node button-restoration.mjs --integrated` 退出 0；正常运行组不替换样式，确认无 Button.css、单一 css-root；36 组、180 状态与基准精确一致，鼠标/键盘主体效果一致，减少动效为 0，页面错误为空。保存 `button-restoration-integrated.json` |
| 构建后入口 | `node button-build-preview.mjs` 退出 0；本机临时静态服务器加载 Storybook 的 normal/solid/bare/bare-danger/disabled 五例×两主题，常态/hover/鼠标 active 与固定 CSS 一致；另外消费 dist/index.js 实际渲染、重复挂载和按压通过。保存 `button-build-preview.json`；临时服务器已关闭 |
| 范围 | 暂存区仍为用户开工时的 3 项；只读 CSS blob 仍为 `dab69febec84ce8d9e38921c33e2a5de16a8568a`；tokens、controls、all-base、Storybook 配置无改动。Button.tsx 工作区差异只有样式 import；编译器目录仅测试变更，核心、Piv、插件实现没有差异；`git diff --check` 退出 0 |

以上 JSON、脚本及截图均位于前述任务产物目录。早期失败测试生成的 `.vitest-attachments/`、Button 和 selector `__screenshots__/` 保留为失败证据，未暂存，不属于生产实现变更。

### 同场景截图

Edge 153.0.4234.32，视口 1600×1100，等待正常 120ms 过渡结束后截取实际 Example 卡片。六对 PNG 的 SHA-256 分别完全相同；并已人工检查亮色 hover 对照。文件哈希一致证明本次记录场景的整张图相同，不外推为所有设备和未知内容均一致。

| 主题 / 状态 | 旧 CSS 基准 | 修复后正式 TS |
| --- | --- | --- |
| 亮色 / 常态 | [CSS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-css-light-rest.png) | [TS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-style-light-rest.png) |
| 亮色 / 悬停 | [CSS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-css-light-hover.png) | [TS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-style-light-hover.png) |
| 亮色 / 按下 | [CSS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-css-light-active.png) | [TS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-style-light-active.png) |
| 暗色 / 常态 | [CSS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-css-dark-rest.png) | [TS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-style-dark-rest.png) |
| 暗色 / 悬停 | [CSS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-css-dark-hover.png) | [TS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-style-dark-hover.png) |
| 暗色 / 按下 | [CSS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-css-dark-active.png) | [TS](C:/Users/edsol/.codex/visualizations/2026/09/18/01a0b505-260d-7e00-8038-2d8861ccd785/restored-integrated-style-dark-active.png) |
