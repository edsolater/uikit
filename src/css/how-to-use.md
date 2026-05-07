# 如何引用 UIKit CSS

`src/css` 存放可以被外部项目单独引入的原子化 CSS 文件。每个文件只负责一个稳定样式职责，例如 `reset.css` 只负责浏览器默认样式重置，`control.css` 负责浏览器内置控件外观，`color.css` 负责颜色领域，`dimension.css` 负责尺寸领域。

## 安装包

```bash
bun add @edsolater/uikit
```

## 在应用入口引入

大多数应用只需要引入 `reset.css`、`color.css`、`dimension.css` 和 `control.css`：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/control.css'
```

如果项目有自己的全局样式，建议先引入 UIKit 的原子 CSS，再引入项目样式：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/control.css'
import './app.css'
```

| 需求 | 引入方式 |
| --- | --- |
| 使用浏览器 reset、颜色函数、尺寸函数和内置控件外观 | `reset.css` + `color.css` + `dimension.css` + `control.css` |
| 只清洗浏览器内置控件外观 | `control.css` |
| 只使用颜色领域 | `color.css` |
| 只使用尺寸领域 | `dimension.css` |
| 自己写全局样式 | UIKit CSS 在前，业务 CSS 在后 |

## control.css 怎么用

`control.css` 只处理浏览器内置控件的默认外观，例如 `button`、`input`、`textarea`、`select`、`progress`、`meter` 和 `dialog`。它不是组件主题，也不接入 `color.css` 的品牌色推导。和 `color.css` 一起使用时，如果希望控件固定使用这层的科技蓝默认值，就把 `control.css` 放在 `color.css` 后面引入。

控件强调色集中在根节点的 `--color-accent`，默认是固定科技蓝。业务项目如果希望控件使用自己的强调色，可以在业务 CSS 里覆盖：

```css
:root {
  --color-accent: oklch(70% 0.16 210deg);
}
```

`control.css` 会用 `--color-accent` 派生控件边框、底色、hover 和 focus ring。其中控件边界默认由 10% 强调色和中性灰混合，避免 Chrome 原生输入框、选择器和按钮的系统外观过重。

## color.css 怎么用

`color.css` 提供颜色函数和 `:root` 上的全局颜色变量。它是 color 领域入口，不再拆出独立的 color utilities 文件。

颜色不应该散落在组件和页面里成为不定的独立值。它和魔法数字一样，一旦到处手写，就会让主题、深浅模式、品牌替换和可访问性调整变得不可控。因此 `color.css` 把颜色集中定义到 `:root`，让组件只消费统一语义变量。

集中管理不代表业务不能改。业务项目可以利用 CSS cascade 覆盖源色，通常只覆盖两个源色：

```css
:root {
  --color-brand: oklch(62% 0.17 255deg);
  --color-accent: oklch(70% 0.16 45deg);
}
```

默认情况下，`--color-accent` 会从 `--color-brand` 派生；业务有独立辅助强调色时，可以覆盖 `--color-accent`。覆盖源色后，`--color-background`、`--color-text`、`--color-brand-fill` 等语义色会继续由 `color.css` 自动推导。

`brand` 和 `accent` 的职责边界见 [color-brand-accent.md](D:/mycode/ai-rules/design/color-brand-accent.md)。简短规则是：`brand` 表示产品主线，`accent` 表示局部注意力，低强调场景使用 `soft`、`muted` 这类语义变量，不新增第三种颜色身份。

组件和页面应优先消费语义色，而不是自己判断浅色或深色模式：

```css
.panel {
  color: --color(text);
  background: --color(surface);
  border-color: --color(boundary);
}
```

`color.css` 内部使用 `light-dark()` 让 `--color-text`、`--color-background`、`--color-surface` 这类语义变量自动跟随系统浅色或深色设置。按钮这类有填充色的场景默认使用柔和智能前景色：

```css
.primary-button {
  color: --color(on-brand);
  background: --color(brand-fill);
}
```

`contrast-color()` 只放在 `*-contrast` 变量里作为高对比兜底，适合小字号或强可访问性场景：

```css
.primary-button[data-density='compact'] {
  color: var(--color-on-brand-contrast);
}
```

## color.css 里的颜色函数

`--tune()` 是底层相对通道编辑器，只使用 OKLCH 通道名和带符号 delta：

```txt
hue
lightness
chroma
opacity
```

```css
.button {
  background: --tune(var(--color-brand), lightness, 10%);
}

.button.is-muted {
  background: --tune(var(--color-brand), lightness, -8%);
}
```

绝对设置使用 `--pin()`，不要把“设置到某个值”和“相对移动多少”混在一个函数里。连续设置两个或三个通道时，使用 `--pin2()` / `--pin3()`，它们只表示连续操作次数：

```css
.swatch {
  background: --pin(var(--color-brand), chroma, 0);
}
```

`--lighten()`、`--darken()`、`--saturate()`、`--desaturate()`、`--hue-rotate()`、`--grayscale()` 是常用设计方言，适合业务 CSS 直接阅读：

```css
.button:hover {
  background: --darken(var(--color-brand), 8%);
}
```

方言函数的 `amount` 都有默认档位。`--lighten(color)` 和 `--darken(color)` 默认调整 `10%`，相当于十级亮度尺度中的一档；`--saturate(color)` 和 `--desaturate(color)` 默认调整 `0.02` 彩度；`--hue-rotate(color)` 默认旋转 `36deg`。

`--mix2()`、`--mix3()`、`--mix4()`、`--tint()`、`--shade()`、`--tone()`、`--dim()` 表示调色板混合能力。它们包装原生 `color-mix()`，固定使用 `oklab`，让调用处不用反复声明颜色空间：

```css
.avatar {
  background: --mix3(#ffdbac, 3, #e0ac69, 2, #8d5524, 1);
}
```

`--tint(color)` 和 `--dim(color)` 默认保留 16% 原色；`--shade(color)` 和 `--tone(color)` 默认保留 72% 原色。需要更强或更弱时再显式传入 weight。

## dimension.css 怎么用

`dimension.css` 不是尺寸 token 表，而是一套尺寸数学生成器。组件和业务 CSS 应表达尺度级数，而不是散落手写像素：

```css
.button {
  height: --size(2);
  padding-inline: --space(5);
  padding-block: --space(2);
  border-radius: --radius(3);
  border-width: --boundary(1);
}
```

`--space()` 用于 `padding`、`margin`、`gap` 和 `inset`。`--size()` 用于控件高度、图标尺寸、触控目标和固定规格容器。`--radius()` 用于圆角。`--boundary()` 用于边框、描边、focus ring 和分割线厚度。

底层函数按用途拆开：

```txt
--step()       指数尺度，用于普通 UI 尺寸
--scale-log()  对数尺度，用于压缩数据驱动尺寸
--limit()      通道约束，用于限制极端值
--snap()       像素吸附，用于减少半像素模糊
```

数据驱动 UI 不应该把原始数据直接当 px 使用，应先压缩成可视范围：

```css
.heat-point {
  inline-size: --data-size(320);
  block-size: --data-size(320);
}
```

业务可以覆盖根节点源值来整体调整密度：

```css
:root {
  --space-base: 4px;
  --space-ratio: 1.2;
  --size-base: 20px;
  --size-ratio: 1.16;
}
```

## TODO

颜色和尺寸已经开始去魔法数字化。后续还需要继续判断字号、行高、阴影和动效时长是否应该进入独立领域；当前暂不实现。

## 构建注意事项

外部项目的构建工具需要支持从依赖包中引入 CSS。Vite、现代 Rollup、Webpack 和 Rspack 项目通常可以直接处理这种写法。

`color.css` 使用 CSS `@function`、`if()`、相对颜色语法、`color-mix()` 和 OKLCH。`dimension.css` 使用 CSS `@function`、`pow()`、`log()` 和 `round()`。它们都面向最新 Chrome，不面向旧浏览器兼容。

UIKit 发布包会把 `src/css` 原样复制到 `dist/css`，并通过 `package.json` 的 `exports` 暴露 `./css/*`。因此外部项目不应该引用 `dist` 路径，也不应该引用 UIKit 源码路径。

推荐路径：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import '@edsolater/uikit/css/dimension.css'
import '@edsolater/uikit/css/control.css'
```

不要使用：

```ts
import '@edsolater/uikit/dist/css/reset.css'
import '@edsolater/uikit/dist/css/color.css'
import '@edsolater/uikit/dist/css/dimension.css'
import '@edsolater/uikit/dist/css/control.css'
import '@edsolater/uikit/src/css/reset.css'
import '@edsolater/uikit/src/css/color.css'
import '@edsolater/uikit/src/css/dimension.css'
import '@edsolater/uikit/src/css/control.css'
```
