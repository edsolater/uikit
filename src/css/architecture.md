# UIKit CSS Architecture

UIKit CSS 不是 Tailwind 工具类体系，也不是传统 token 表。它是一套以 `@function` 为调用入口的 CSS 内部设计语言。

最短规则：

```txt
TSX 写信息。
CSS 写形式。
第一层管源头。
第二层管材料。
第三层管翻译。
```

## 核心目标

全局 UI 必须统一，所以颜色、尺寸、边界、圆角这类视觉值不能散落成魔法值。

集中管理不能只停留在 `var(...)` token 表，因为 `var(--color-text)`、`var(--space-normal)` 这类写法会让组件 CSS 充满实现噪音。UIKit CSS 用 `@function` 把集中管理、复杂推导和干净调用合成一个设计语言入口：

```css
.button {
  color: --color(text);
  background: --color(brand-fill);
  min-block-size: --size(7);
  padding-inline: --space(6);
  padding-block: --space(3);
  border-radius: --radius(4);
  border-width: --boundary(1);
}
```

这里的函数不是为了炫技，而是为了让组件 CSS 只表达“需要哪个视觉通道”，不暴露 `var(...)`、`light-dark(...)`、`color-mix(...)` 或复杂 `calc(...)`。

## 分层模型

```txt
TSX / HTML 信息层
  负责表达组件身份、信息意图、权重和状态。

Component CSS 使用层
  负责选择视觉通道，例如 --color(text)、--space(5)、--boundary(1)。

CSS @function 翻译层
  负责把设计语言调用翻译成真实 CSS 值，并隐藏 var 噪音和复杂推导。

源参数 / 曲线参数层
  负责决定整套 UI 的紧凑、松弛、圆润、硬朗、厚重、轻盈和品牌气质。
```

不要把皮肤理解成额外文件或额外 token 表。UIKit CSS 里，曲线层和源参数层就是皮肤层：

```css
:root {
  --space-base: 4px;
  --space-ratio: 1.25;
  --size-base: 20px;
  --size-ratio: 1.18;
  --radius-base: 2px;
  --radius-ratio: 1.45;
  --color-brand: oklch(62% 0.17 255deg);
}
```

换这些源参数和曲线参数，就是换整套 UI 气质。

## 三层 CSS

### 第一层：源参数 / 曲线参数

这一层只放真正决定系统气质的源头。

Color 领域的主源是 `--color-brand`。`--color-accent` 默认由 brand 派生，业务有独立辅助强调色时可以覆盖，但它仍然是主题源色体系的一部分。`--color-ink-*`、`--color-base-*`、`--color-text`、`--color-background` 都不是第一层源头，它们是衍生材料。

Dimension 领域的源头是曲线参数，而不是一张 `sm/md/lg` 表：

```css
:root {
  --space-base: 4px;
  --space-ratio: 1.25;
  --size-base: 20px;
  --size-ratio: 1.18;
  --radius-base: 2px;
  --radius-ratio: 1.45;
  --boundary-base: 1px;
  --boundary-ratio: 1.5;
}
```

这些参数回答的是：整套 UI 是紧凑还是松弛，是圆润还是硬朗，是轻盈还是厚重。

### 第二层：衍生变量 / 基础工具

这一层把源参数加工成可观察、可复用的材料，也放基础工具函数。

Color 材料包括：

```txt
--color-base
--color-ink
--color-brand-1
--color-accent-1
--color-text
--color-background
--color-border
```

这些值可以观察，也可以通过 cascade 覆盖，但组件 CSS 默认不直接消费它们。组件应优先使用 `--color(role)`。

Dimension 材料包括：

```txt
--space-min / --space-max
--size-min / --size-max
--radius-min / --radius-max
--boundary-min / --boundary-max
--dimension-snap-unit
```

基础工具包括：

```txt
color: --tune(), --tune2(), --tune3(), --pin(), --pin2(), --pin3(), --mix2(), --mix3(), --mix4()
dimension: --step(), --scale-log(), --limit(), --snap()
```

基础工具不直接代表组件语义，它们只服务衍生材料和综合翻译函数。

### 第三层：综合翻译函数

这是组件 CSS 的主要调用入口：

```txt
--color(role)
--space(n)
--size(n)
--radius(n)
--boundary(n)
```

组件不应该到处写：

```css
color: var(--color-text);
background: light-dark(var(--color-base-1), var(--color-ink));
padding-inline: calc(var(--space-base) * pow(var(--space-ratio), 6));
```

组件应该写：

```css
color: --color(text);
background: --color(background);
padding-inline: --space(6);
```

`@function` 即使只是包一层 `var(...)` 也有价值，因为它把实现噪音变成设计语言调用。

## TSX / HTML 边界

TSX / HTML 不负责具体视觉值。它负责：

```txt
组件身份
信息意图
信息权重
信息状态
密度语义
```

可以写：

```tsx
<Button intent="brand" weight="strong" data-state="active" />
```

不要写：

```tsx
<div className="p-4 rounded-lg border" />
<div className="space-5 size-7 radius-4" />
```

视觉 token 不进 `className`。组件 CSS 根据组件身份和数据属性选择视觉通道：

```css
.button[data-weight='strong'] {
  min-block-size: --size(8);
  padding-inline: --space(7);
}
```

## 文件职责

`color.css` 是 color 领域入口。它承载颜色源参数、衍生材料、颜色工具函数和 `--color(role)` 翻译函数。

`dimension.css` 是 dimension 领域入口。它承载空间、物体尺寸、圆角、边界和数据尺寸的曲线参数、约束参数、基础数学工具和综合翻译函数。

`reset.css` 只负责浏览器默认样式重置，不承载设计语言。

`how-to-use.md` 面向外部使用者说明如何引入和调用这些 CSS 文件。

## 命名规则

颜色翻译入口使用 `--color(role)`。`role` 使用不带引号的 CSS ident，例如 `text`、`background`、`brand-fill`。

尺寸翻译入口使用通道名：

```txt
--space(n)     空白
--size(n)      物体尺度
--radius(n)    形体圆角
--boundary(n)  边界厚度
```

边框、描边、分割线和 focus ring 统一属于 `boundary` 通道，不再使用 `stroke` 作为公开翻译入口。

## 最终定义

UIKit CSS 是一套以 `@function` 为调用入口的 CSS 内部设计语言。

变量负责集中存储，函数负责干净调用，曲线负责整体换肤。
