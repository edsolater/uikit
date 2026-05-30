# 如何引用 UIKit CSS

`src/css` 存放可以被外部项目单独引入的原子化 CSS 文件。每个文件只负责一个稳定样式职责：

| 文件 | 职责 |
| --- | --- |
| `all-base.css` | 基础 CSS 的整包入口，统一管理 layer 顺序 |
| `reset.css` | 浏览器默认样式重置 |
| `color.css` | 颜色源参数、语义颜色变量和调色工具 |
| `dimension.css` | 尺寸曲线参数、公开尺寸变量和数学工具 |
| `controls.css` | 浏览器内置 controls 的轻量外观清洗 |
| `traits.css` | trait plugin 自动附加到 DOM 上的功能类 |

## 安装包

```bash
bun add @edsolater/uikit
```

## 在应用入口引入

如果你想一次引入 UIKit 的基础 CSS，推荐直接使用：

```ts
import '@edsolater/uikit/css/all-base.css'
import './app.css'
```

`all-base.css` 会统一引入 `reset`、`style-token`、`controls` 和 `traits` 这几个领域，并用 `@layer` 固定它们的顺序。

如果你需要只挑部分碎片文件，再按下面的顺序单独引入：

推荐顺序：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/controls.css'
import '@edsolater/uikit/css/traits.css'
import './app.css'
```

业务 CSS 放在最后，这样可以通过 cascade 覆盖 UIKit 的源参数和公开变量。

## all-base.css 怎么用

`all-base.css` 是 UIKit 基础 CSS 的整包入口。它适合不想逐个维护碎片 CSS 导入顺序的项目。

它内部声明的 layer 顺序是：

```css
@layer reset, style-token, controls, traits;
```

这样即使后续每个领域继续拆分文件，外部项目也只需要稳定引入一个入口。

## 消费规则

公开样式值使用标准 CSS 自定义属性，不再使用 `--color(text)`、`--space(5)` 这类翻译函数。

推荐：

```css
.panel {
  color: var(--color-fg);
  background: var(--color-surface-low);
  border: var(--boundary-1) solid var(--color-line);
  padding: var(--space-5);
  border-radius: var(--radius-4);
}
```

不要写：

```css
.panel {
  color: --color(text);
  background: --color(surface);
  padding: --space(5);
  border-radius: --radius(4);
}
```

## color.css 怎么用

`color.css` 把颜色集中定义到 `:root`，组件和业务直接消费 `var(--color-*)`。

常用公开变量：

```css
.primary-button {
  color: var(--color-action-fg);
  background: var(--color-action);
}

.card {
  color: var(--color-fg);
  background: var(--color-surface-low);
  border-color: var(--color-line);
}
```

业务通常只覆盖源色：

```css
:root {
  --base-brand: oklch(62% 0.17 255deg);
}
```

`--shift-color-channel()`、`--color-adjust()`、`--color-mix()` 仍然是颜色工具函数。`--color-adjust()` 负责单源颜色派生，`--color-mix()` 负责多颜色因素合成。它们适合在 `color.css` 内部或需要生成新变量时使用，不作为组件公开消费的默认写法。

```css
:root {
  --color-product: --color-adjust(var(--color-brand), delta-hue, 18deg);
}
```

## dimension.css 怎么用

`dimension.css` 把尺寸曲线生成结果落到 `:root` 的公开变量上，组件和业务直接消费 `var(--space-*)`、`var(--size-*)`、`var(--radius-*)`、`var(--boundary-*)`。

```css
.button {
  min-height: var(--size-3);
  padding-inline: var(--space-5);
  padding-block: var(--space-2);
  border-radius: var(--radius-3);
  border-width: var(--boundary-1);
}
```

业务可以覆盖曲线源参数来整体调整密度：

```css
:root {
  --space-base: 4px;
  --space-ratio: 1.2;
  --size-base: 20px;
  --size-ratio: 1.16;
}
```

## controls.css 怎么用

`controls.css` 只处理浏览器内置 controls 的默认外观。这里的 controls 表示小空间里的内置交互单元，例如 `button`、`input`、`textarea`、`select`、`progress`、`meter` 和 `dialog`。它不是组件主题。

业务如果需要调整 controls 强调色，应覆盖主题源参数或语义 token：

```css
:root {
  --base-brand: oklch(70% 0.16 210deg);
}
```

## traits.css 怎么用

`traits.css` 只提供少量由 trait plugin 自动附加到 DOM 上的功能类。它适合那些语义非常稳定、效果非常单一、但又不值得上升成组件身份或主题 token 的正交小能力。

组件层的典型写法是：

```tsx
<Piv class="card" trait={clickable} />
```

trait plugin 会把这类能力落成真实 DOM class，例如 `trait:clickable`。

业务层真正消费的通常是：

```tsx
<Card>xxx</Card>
```

如果某个组件明确决定开放受控 trait 扩展，外界才会写：

```tsx
<Card trait={special}>xxx</Card>
```

即使这种例外成立，外界表达的也仍然是 trait，而不是手写 `trait:special`。

例如 `trait:backdrop-root` 用来给 `backdrop-filter` 建立明确的裁切边界：

```html
<div class="trait:backdrop-root">
  <div class="glass-panel"></div>
</div>
```

它只负责 backdrop 的边界，不负责圆角、背景、阴影或模糊强度；这些视觉表达仍应由组件样式自己声明。

## 构建注意事项

UIKit 发布包会把 `src/css` 原样复制到 `dist/css`，并通过 `package.json` 的 `exports` 暴露 `./css/*`。外部项目不要引用 `dist` 路径，也不要引用 UIKit 源码路径。

推荐：

```ts
import '@edsolater/uikit/css/all-base.css'
```

或者按需单独引入：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/controls.css'
import '@edsolater/uikit/css/traits.css'
```

不要使用：

```ts
import '@edsolater/uikit/dist/css/reset.css'
import '@edsolater/uikit/dist/css/color.css'
import '@edsolater/uikit/dist/css/dimension.css'
import '@edsolater/uikit/dist/css/controls.css'
import '@edsolater/uikit/dist/css/traits.css'
import '@edsolater/uikit/src/css/reset.css'
import '@edsolater/uikit/src/css/color.css'
import '@edsolater/uikit/src/css/dimension.css'
import '@edsolater/uikit/src/css/controls.css'
import '@edsolater/uikit/src/css/traits.css'
```
