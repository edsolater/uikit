# 如何引用 UIKit CSS

`src/css` 存放可以被外部项目单独引入的原子化 CSS 文件。每个文件只负责一个稳定样式职责：

| 文件 | 职责 |
| --- | --- |
| `reset.css` | 浏览器默认样式重置 |
| `color.css` | 颜色源参数、语义颜色变量和调色工具 |
| `dimension.css` | 尺寸曲线参数、公开尺寸变量和数学工具 |
| `buildin-widgets.css` | 浏览器内置 widget 控件的轻量外观清洗 |

## 安装包

```bash
bun add @edsolater/uikit
```

## 在应用入口引入

推荐顺序：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/buildin-widgets.css'
import './app.css'
```

业务 CSS 放在最后，这样可以通过 cascade 覆盖 UIKit 的源参数和公开变量。

## 消费规则

公开样式值使用标准 CSS 自定义属性，不再使用 `--color(text)`、`--space(5)` 这类翻译函数。

推荐：

```css
.panel {
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--boundary-1) solid var(--color-border);
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
  color: var(--color-on-brand);
  background: var(--color-brand-fill);
}

.card {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
}
```

业务通常只覆盖源色：

```css
:root {
  --color-brand: oklch(62% 0.17 255deg);
  --color-accent: oklch(70% 0.16 45deg);
}
```

`--tune()`、`--pin()`、`--mix2()`、`--mix3()`、`--mix4()`、`--tint()`、`--shade()`、`--tone()`、`--dim()` 仍然是颜色工具函数。它们适合在 `color.css` 内部或需要生成新变量时使用，不作为组件公开消费的默认写法。

```css
:root {
  --color-product-soft: --tint(var(--color-brand), 18);
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

## buildin-widgets.css 怎么用

`buildin-widgets.css` 只处理浏览器内置 widget 控件的默认外观。这里的 widget 表示小空间里的内置交互单元，例如 `button`、`input`、`textarea`、`select`、`progress`、`meter` 和 `dialog`。它不是组件主题。

它默认提供固定科技蓝：

```css
:root {
  --color-accent: oklch(66% 0.19 248deg);
}
```

业务如果需要自己的 widget 强调色，可以在业务 CSS 里覆盖：

```css
:root {
  --color-accent: oklch(70% 0.16 210deg);
}
```

## 构建注意事项

UIKit 发布包会把 `src/css` 原样复制到 `dist/css`，并通过 `package.json` 的 `exports` 暴露 `./css/*`。外部项目不要引用 `dist` 路径，也不要引用 UIKit 源码路径。

推荐：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/buildin-widgets.css'
```

不要使用：

```ts
import '@edsolater/uikit/dist/css/reset.css'
import '@edsolater/uikit/dist/css/color.css'
import '@edsolater/uikit/dist/css/dimension.css'
import '@edsolater/uikit/dist/css/buildin-widgets.css'
import '@edsolater/uikit/src/css/reset.css'
import '@edsolater/uikit/src/css/color.css'
import '@edsolater/uikit/src/css/dimension.css'
import '@edsolater/uikit/src/css/buildin-widgets.css'
```
