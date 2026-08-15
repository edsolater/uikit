# Card 设计规格

## 文档定位

- 本文档是调用方判断是否使用 `Card`、怎样选择属性以及怎样进行特殊样式覆盖的完整入口。
- Storybook 只补充视觉预览；没有查看 Storybook 的用户，也应仅通过本文档正确使用 Card。
- Surface 为什么不是组件，见 [失败组件](../../../../docs/组件失败记录.md)。

## 组件定义

`Card` 表达一个有边界、能够独立理解的信息单元。它把一组相互关联的标题、正文、状态或操作收在同一个可想象对象中。

```txt
Card = 一个独立信息单元 + tone + size
```

最小调用已经是完整可用的 Card：

```tsx
<Card>
  <h2>账户摘要</h2>
  <p>这里是同一个账户单元中的信息。</p>
</Card>
```

调用方不需要先写 class、padding、gap、圆角、背景、边框或阴影，才能让 Card 成立。

## 什么时候使用

- 一组内容可以脱离周围内容，被独立理解或处理时使用 `Card`。
- 标题、说明、状态和操作共同描述同一个对象或主题时使用 `Card`。
- 同类信息单元需要以列表或网格并列展示时，每个单元可以使用一个 `Card`。
- 需要调整 Card 的视觉声量或内部容纳尺度时，使用 `tone` 和 `size`。

## 什么时候不使用

- 只需要无视觉身份的 DOM 分组时，使用 `Piv` 或原生元素。
- 页面主区域、侧边栏、详情 Pane 或普通 Section 应按真实区域角色定义，不能因为它有背景就改叫 Card。
- Popover、Dialog 和 Menu 拥有自己的交互与层级协议，不使用 Card 代替。
- Card 不负责 Drag、Top Layer 提升、页面宽高、外部定位或周围布局。

## 快速使用

### 默认 Card

```tsx
<Card>普通信息单元</Card>
```

### 与正文语义组合

当 Card 表现的是一篇可独立理解的正文时，让 Article 成为调用主体，Card 只提供视觉形式：

```tsx
<Article as={Card}>可独立理解的正文</Article>
```

普通 Card 不需要为了补充弱结构信息而指定 `as="section"`。只有原生语义本身能够显著帮助阅读时，才把它提升成明确的语义组件。

### 选择视觉声量

```tsx
<Card soft>低声量辅助信息</Card>
<Card>默认信息卡片</Card>
<Card solid>需要稳定阅读对比的信息</Card>
```

### 选择物理尺度

```tsx
<Card small>紧凑信息</Card>
<Card>默认信息</Card>
<Card large>宽松信息</Card>
<Card xlarge>大尺寸信息单元</Card>
```

## Props 总览

`CardProps` 的公开调用签名等价于：

```ts
interface CardProps<Tag extends PivSupportedElementTag = 'div'>
  extends PivProps<Tag>,
    BrandProps<'tone', 'soft' | 'solid'>,
    BrandProps<'size', 'small' | 'large' | 'xlarge'> {}
```

### Card 自有属性

| 属性 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `soft`、`solid` | `Source<boolean \| undefined>` | `undefined` | 确定的视觉声量描述词。 |
| `tone` | `Source<'soft' \| 'solid' \| undefined>` | `undefined` | 视觉声量会变化时使用的不定字段。 |
| `small`、`large`、`xlarge` | `Source<boolean \| undefined>` | `undefined` | 确定的物理尺度描述词。 |
| `size` | `Source<'small' \| 'large' \| 'xlarge' \| undefined>` | `undefined` | 物理尺度会变化时使用的不定字段。 |

确定描述词和值字段都可以响应式变化。不定字段一旦声明便接管同组输入；同组冲突只警告，不中断运行。

### 从 Piv 继承的属性

| 属性 | Card 中的含义 |
| --- | --- |
| `as` | 选择根原生元素，默认是 `div`；独立正文优先写成 `Article as={Card}`。 |
| `children` | 提供属于同一个信息单元的完整内容。 |
| `id` | 设置根元素原生 id。 |
| `if` | 为 `false` 时 Card 与 children 都不进入 DOM。 |
| `class` | 与根身份 `Card` 合并，用于业务身份或特殊表现。 |
| `style` | 设置根元素行内样式或单实例 CSS 变量。 |
| `htmlProps` | 设置原生 HTML、ARIA、`data-*` 或 DOM property。 |
| `on` | 注册根元素原生事件；Card 本身不增加点击协议。 |
| `ref` | 取得根 DOM，作为命令式逃生口。 |
| `plugin` | 注入一个 Piv 底层能力。 |
| `plugins` | 注入多个 Piv 底层能力。 |
| `trait` | 注入稳定性质或能力。 |
| `shadowProps` | 上层组件封装 Card 时转交低优先级 Piv props。 |

`as` 由 `PivSupportedElementTag` 约束，TypeScript 会根据所选标签检查 `htmlProps` 的原生属性类型。

## Tone

`tone` 只调整同一种 Card 的视觉声量，不表示业务种类、交互状态或 Top Layer 层级。

| 写法 | 表现 | 适用场景 |
| --- | --- | --- |
| 省略 `tone` | 半透明主题背景、柔和边界、基础卡片阴影 | 普通信息卡片。 |
| `soft` | 更透明的主题背景、更弱边界、更轻阴影 | 辅助信息、嵌套信息单元。 |
| `solid` | 实体主题背景、完整柔和边界、基础卡片阴影 | 需要稳定文字对比的卡片。 |

- 默认 tone 通过省略表达，不提供 `normal`。
- `soft` 不是 disabled，也不降低内容可读性。
- `solid` 不表示 Card 被提升到 Top Layer。

## Size

`size` 只调整 Card 内部容纳内容的物理尺度，不设置外部宽高或定位。

| 写法 | Padding | Gap | Radius | 适用场景 |
| --- | --- | --- | --- | --- |
| `small` | `--space-4` | `--space-3` | `--radius-3` | 紧凑信息单元。 |
| 省略 `size` | `--space-6` | `--space-5` | `--radius-4` | 普通信息单元。 |
| `large` | `--space-7` | `--space-6` | `--radius-4` | 宽松信息单元。 |
| `xlarge` | `--space-8` | `--space-7` | `--radius-4` | 内容较多的大尺寸信息单元。 |

尺寸确定时优先写 `small`、`large` 或 `xlarge`。具体档位由现有界面状态决定时，使用 `size`；它的字段轮廓明确告诉阅读者该分类是不定的。

tone 与 size 的默认解析结果都是 `undefined`，没有额外的默认候选。

## CSS 变量

Card 公开以下六个 CSS 变量。它们只处理业务中的特殊表现，不是正常使用 Card 的前置条件。

| 变量 | CSS 值类型 | 默认来源 | 影响属性 | 含义 |
| --- | --- | --- | --- | --- |
| `--Card-bg` | `<background>` | 当前 `tone` | `background` | Card 的完整背景。 |
| `--Card-border` | `<border>` | 当前 `tone` | `border` | Card 的完整边框声明。 |
| `--Card-shadow` | `<box-shadow>` | 当前 `tone` | `box-shadow` | 未提升状态的基础卡片阴影。 |
| `--Card-padding` | `<length-percentage>{1,4}` | 当前 `size` | `padding` | Card 的内部内容空间。 |
| `--Card-gap` | `<length-percentage>{1,2}` | 当前 `size` | `gap` | Card 直属内容之间的节奏。 |
| `--Card-radius` | `<length-percentage>{1,4}` | 当前 `size` | `border-radius` | Card 的圆角形状。 |

### Tone 默认值

| Tone | `--Card-bg` | `--Card-border` | `--Card-shadow` |
| --- | --- | --- | --- |
| 默认 | `color-mix(in oklab, var(--color-surface) 78%, transparent)` | `var(--boundary-1) solid color-mix(in oklab, var(--color-line-soft) 72%, transparent)` | `var(--shadow-card)` |
| `soft` | `color-mix(in oklab, var(--color-surface) 58%, transparent)` | `var(--boundary-1) solid color-mix(in oklab, var(--color-line-soft) 48%, transparent)` | `var(--shadow-1)` |
| `solid` | `var(--color-surface)` | `var(--boundary-1) solid var(--color-line-soft)` | `var(--shadow-card)` |

### Size 默认值

| Size | `--Card-padding` | `--Card-gap` | `--Card-radius` |
| --- | --- | --- | --- |
| `small` | `var(--space-4)` | `var(--space-3)` | `var(--radius-3)` |
| 默认 | `var(--space-6)` | `var(--space-5)` | `var(--radius-4)` |
| `large` | `var(--space-7)` | `var(--space-6)` | `var(--radius-4)` |
| `xlarge` | `var(--space-8)` | `var(--space-7)` | `var(--radius-4)` |

### 特殊覆盖

当前需求能够由 `tone` 或 `size` 表达时，不覆盖变量。业务独有且不应成为通用档位的背景、边框或密度，可以通过业务 class 覆盖：

```tsx
<Card class="account-summary">账户摘要</Card>
```

```css
.Card.account-summary {
  --Card-bg: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-brand) 12%, var(--color-surface)),
    var(--color-surface)
  );
}
```

单实例也可以通过 `style` 覆盖：

```tsx
<Card style={{ '--Card-shadow': 'none' }}>特殊实例</Card>
```

移除业务 class 或 style 后，Card 仍然必须是完整、可识别的信息卡片。

## 交互边界

- Card 默认不是按钮，也不因为注册 click 事件就自动获得按钮语义。
- 整卡点击、选中状态、链接导航和复杂操作区需要先形成明确协议，再由具体组件或后续 Card 能力表达。
- 不要把交互 Card 临时实现成带 `onClick` 的普通 `div`，同时缺少键盘和可访问性语义。
- Top Layer 的提升状态与提升阴影仍由 Top Layer 负责。

## 主题与性能

- 所有 tone 都从当前主题的 `--color-surface`、`--color-line-soft` 和阴影 Token 取值；暗色主题不复用硬编码半透明白色。
- Card 禁止使用 `backdrop-filter: blur(...)` 和 `filter: blur(...)`。
- 当前颜色增强只有 `saturate(1.12) brightness(1.03)`，不移动像素，也不是 Card 成立的前提。
- 如果 Trace 显示颜色过滤仍有明显合成成本，可以直接删除过滤，只保留背景、边框和阴影。
