# Style System 命名

本文规定 Style System 中样式对象的命名方向、语义层级与 CSS 实现边界。对象模型与编译语义见 [design.md](design.md)，现役文件职责与运行链见 [architecture.md](architecture.md)，组件中的样式组织见 [样式文件写法](../../docs/style/样式文件写法.md)。

本文只裁决 Style System 怎样认识和命名样式，不把浏览器 CSS 属性名直接当作代码对象的名称，也不为具体组件决定视觉方案。

# 命名硬约束

| 约束 | 裁决 | 示例 |
| --- | --- | --- |
| 最少两个单词 | Style System 自行定义的 CSS 名称必须包含两个及以上的完整单词。单词用 namespace 和逐步具体化的对象组成。 | `color-background`、`color-surface`、`motion-duration-fast` |
| 编号不充当单词 | 数字可以限定尺度，但不算一个完整单词；编号前仍需有至少两个完整单词。 | 使用 `space-scale-2`，不使用 `space-2`。 |
| 单词名称例外 | 只有用户明确指定某个单词名称时才允许使用。Agent 不能因为名称常见、简短或当前没有冲突，自行定义单词名称。 | 未经明确指定，不得定义 `surface`、`action`、`motion`、`background` 或 `foreground` 作为完整 CSS 名称。 |
| namespace 在前 | 名称先写所属样式 namespace，再写语义主体、实现位置和必要限定。 | 使用 `color-background`，不使用 `background-color` 作为 Style System 自有名称。 |
| 禁止 `BG` / `FG` | `bg`、`fg`、`BG`、`FG` 都不是允许的名称单词或缩写。必须完整写作 `background`、`foreground`。 | 使用 `color-background`、`color-foreground`，不使用 `color-bg`、`color-fg`。 |
| 外部 CSS 协议 | 浏览器原生属性、关键字、函数和选择器不是 Style System 自行定义的名称，不受两个单词和 namespace 顺序约束。只有 CSS Key 的 JS 标识符使用 `$` 前缀。 | `$color`、`$backgroundColor`；`colorMix()`、`focusVisible` 不加 `$`。 |

CSS 名称中的“单词”指以连字符分隔的完整语义词；开头的 `--` 和纯数字片段都不算单词。`--color-background` 有两个单词，`--space-scale-2` 有两个单词和一个编号；`--background`、`--space-2` 和 `--fg` 都不足两个完整单词，未经用户明确指定不得定义。

这项约束覆盖 Variable 基础名、Keyframes 名、CSS `@function` 名及其他由 Style System 定义、最终作为完整标识写入 CSS 的名称。Condition name 只作为派生名称中的一个片段时，检查生成后的完整名称，不把该片段当作独立 CSS 名称。

# CSS 名称与源码名称分工

CSS 名称和 TypeScript 标识符不做逐词映射。CSS 名称承担全局地址、namespace 和冲突规避；源码名称服务调用处阅读，应该与 Key、Condition、模块和类型共同组成一句话。

| 源码命名原则 | 裁决 | 示例 |
| --- | --- | --- |
| `$` 只标识 CSS Key | 由 `key()` 建立、直接表示 CSS 属性写入位置的标识符以 `$` 开头；Condition、Mixin、Value、CSS 函数表达和普通值均不使用 `$`。看到 `$` 即可确定对象是 CSS Key。 | `$backgroundColor`、`$padding`；`focusVisible`、`colorMix()`、`translateY()`。 |
| 自定义词不加 `$` | `value()`、`variable()`、Mixin 及组件语义都沿用普通 JS 名称。Variable 即使作为声明目标，也不因此增加 `$`。 | `surface`、`tone`、`pill`、`clickable()`。 |
| 不复述 Key | Key 已经说明属性时，Value 只表达尚未出现的语义、状态或程度。 | `[$backgroundColor, surface]`，不写 `[$backgroundColor, colorSurfaceBackground]`。 |
| 不建立属性镜像 | 不为每个 CSS Key 创建去掉 `$` 的“原始 Variable”。只重复实现位置的名称没有表达能力。 | 使用 `[$fontWeight, bold]`，不写 `[$fontWeight, fontWeight]`。 |
| Mixin 命名效果 | Mixin 赋予当前主体一个与具体组件无关的完整效果；名称回答“获得什么效果”，不复述内部属性。 | `clickable()`、`focusRing()`、`inlineCenter()`。 |
| 按服务对象区分 | 当前原始值相同，但服务对象不同，仍然建立不同 Value。 | 一像素边缘使用 `thinBoundary`，一像素按压位移使用 `pressOffset`。 |
| 冲突暴露歧义 | 两个 Value 在同一阅读范围内无法使用同一名称，说明名称没有表达各自服务对象，不能靠复制同一个 Value 或机械加 namespace 掩盖。 | `focusStroke` 与 `focusGap` 分别表达线条和间隔。 |
| 不为字面量制造跳转 | 原始值没有复用关系、条件、依赖或独立语义时，直接写字符串或数字。 | 使用 `'8px'`，不建立只包装它的 `px8`。 |
| 不镜像 CSS 路径 | 源码名称不需要复制 CSS 名称的全部单词与顺序。 | `fast` 对应 `motion-duration-fast`。 |

例如，Variable 必须表达独立的语义输入，CSS 落盘名称仍保留完整路径：

```ts
export const tone = variable('color-tone-base', { fallback: accent })
```

普通属性 Key 是浏览器协议的代码表示，不是 Style System 自己创造的 CSS 名称，因此写作 `$backgroundColor = key('background-color')`。`$backgroundColor` 只表示 CSS 实现位置；右侧 Value 选择放入该位置的语义内容：

```ts
[tone, danger]
[$backgroundColor, toneSurface]
```

这里的 `$` 只回答“这个对象是否是 CSS Key”。Condition 和 CSS 函数即使直接表达浏览器语法，也分别写作 `focusVisible`、`media()`、`colorMix()`；原始字符串和普通 Value 同样不使用 `$`。

---

# 样式术语

样式术语分为体验语义、样式 namespace 和实现位置。体验语义回答“给人什么作用”，实现位置回答“最终画在哪里”；两者不能互相替代。

| 单词 | 中文名称 | 身份 | 含义 | 不表示什么 | 名称示例 |
| --- | --- | --- | --- | --- | --- |
| `surface` | 承载面 | 颜色体验语义 | 使页面、卡片、面板、菜单或弹层被感知为承载内容的一个面。 | 不是底色，也不等于背景位。 | `color-surface` / `surface` |
| `action` | 操作语义 | 颜色体验语义 | 为可执行操作提供识别与反馈；可以用于实心操作或裸露操作。 | 不预先绑定背景或前景。 | `color-action` / `action` |
| `motion` | 动效 | 样式 namespace | 表达界面变化在时间上的反馈方式，其下继续区分时长、缓动等对象。 | 不是 `transition`、`transform` 或 `animation` 中任意一个 CSS 实现。 | `motion-duration-fast` / `fast` |
| `background` | 背景位 | 颜色实现位置 | 表示颜色画在内容后方的位置。 | 不说明颜色来自承载面、操作、强调还是危险语义。 | `$backgroundColor` / `surface` |
| `foreground` | 前景位 | 颜色实现位置 | 表示文字、图标、SVG glyph 等前景内容使用颜色的位置。 | 不是单一的原生 CSS 属性。 | `color-foreground` / `foreground` |

`surface` 经常进入背景位，但二者不是同一个对象；`action` 可以进入背景位，也可以进入前景位：

| 体验语义 | 实现位置 | 浏览器实现示例 |
| --- | --- | --- |
| `surface` | `$backgroundColor` | `background-color` |
| 实心操作使用 `action` | `$backgroundColor` | `background-color` |
| 裸露操作使用 `action` | `$color` | `color`、`fill` 或 `stroke` |
| action 上方使用 `actionForeground` | `$color` | `color`、`fill` 或 `stroke` |

需要同时表达语义主体和实现位置时，名称先写语义主体，再写实现位置。`color-action-foreground` 表示适合 action 语义环境的前景颜色；它不是所有前景颜色的总称。

---

# 命名裁决

| 要表达的对象 | CSS 名称 | 源码 Value 名称示例 | 禁止作为自有 CSS 名称 | 浏览器实现示例 |
| --- | --- | --- | --- | --- |
| 背景颜色实现位 | 不建立自有镜像名称 | 由 `$backgroundColor` 表示 | `background`、`background-color`、`bg`、`color-bg` | `background-color` |
| 通用前景颜色 | `color-foreground` | `foreground` | `foreground`、`foreground-color`、`fg`、`color-fg` | `color`、`fill`、`stroke` |
| 承载面颜色语义 | `color-surface` | `surface` | `surface`、`surface-color` | 常进入 `background-color` |
| 操作颜色语义 | `color-action` | `action` | `action`、`action-color` | 可进入背景或前景 |
| action 上的前景颜色 | `color-action-foreground` | `actionForeground` | `action-foreground-color`、`foreground-action-color` | 常进入 `color` |
| 快速动效时长 | `motion-duration-fast` | `fast` | `duration`、`fast-duration` | `transition-duration` 等 |
| 标准动效缓动 | `motion-easing-standard` | `standard` | `easing`、`standard-easing` | `transition-timing-function` 等 |

---

# 文档边界

- 本文维护稳定的样式命名语义与词序。
- [design.md](design.md) 维护 Rule、Value、Declaration、Variable 与编译过程，不重复定义命名体系。
- [architecture.md](architecture.md) 维护文件职责、依赖关系与运行链，不把目录现状当作命名依据。
- 组件 `.style.ts` 选择语义并绑定实现位置，不因某个组件当前怎样使用一个值，就把该用法写进共享对象名称。
- 现有代码与本文不一致时，不用别名长期保留两套名称；具体迁移范围与顺序另行确定。
