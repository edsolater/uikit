# 如何引用 UIKit CSS

`src/css` 存放可以被外部项目单独引入的原子化 CSS 文件。每个文件只负责一个稳定样式职责，例如 `reset.css` 只负责浏览器默认样式重置，`color.css` 只负责颜色变量和颜色工具函数。

## 安装包

```bash
bun add @edsolater/uikit
```

## 在应用入口引入

在外部项目的入口文件里直接引入需要的 CSS 原子文件：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
```

如果项目有自己的全局样式，建议先引入 UIKit 的原子 CSS，再引入项目样式：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
import './app.css'
```

## color.css 怎么用

`color.css` 提供两类能力：一类是 `:root` 上的全局颜色变量，一类是 CSS 自定义函数。

颜色不应该散落在组件和页面里成为不定的独立值。它和魔法数字一样，一旦到处手写，就会让主题、深浅模式、品牌替换和可访问性调整变得不可控。因此 `color.css` 把颜色集中定义到 `:root`，让组件只消费统一语义变量。

集中管理不代表业务不能改。业务项目可以利用 CSS cascade 覆盖源色，通常只覆盖两个源色：

```css
:root {
  --color-brand: oklch(62% 0.17 255deg);
  --color-accent: oklch(70% 0.16 45deg);
}
```

覆盖源色后，`--color-background`、`--color-text`、`--color-brand-fill` 等语义色会继续由 `color.css` 自动推导。

`brand` 和 `accent` 的职责边界见 [color-brand-accent.md](D:/mycode/ai-rules/design/color-brand-accent.md)。简短规则是：`brand` 表示产品主线，`accent` 表示局部注意力，低强调场景使用 `soft`、`muted` 这类语义变量，不新增第三种颜色身份。

组件和页面应优先消费语义色，而不是自己判断浅色或深色模式：

```css
.panel {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
}
```

`color.css` 内部使用 `light-dark()` 让 `--color-text`、`--color-background`、`--color-surface` 这类语义变量自动跟随系统浅色或深色设置。按钮这类有填充色的场景默认使用柔和智能前景色：

```css
.primary-button {
  color: var(--color-on-brand);
  background: var(--color-brand-fill);
}
```

`contrast-color()` 只放在 `*-contrast` 变量里作为高对比兜底，适合小字号或强可访问性场景：

```css
.primary-button[data-density='compact'] {
  color: var(--color-on-brand-contrast);
}
```

`--shift()` 表示让一个颜色发生一次变化：

```css
.button {
  background: --shift(var(--color-brand), "lighten", 10%);
}
```

`--shift2()` 和 `--shift3()` 表示连续变化两次或三次：

```css
.button:hover {
  background: --shift2(var(--color-brand), "darken", 8%, "saturate", 4%);
}
```

`--mix2()`、`--mix3()`、`--mix4()` 表示按权重混合多个颜色，语义相当于调色盘里按比例混色：

```css
.avatar {
  background: --mix3(#ffdbac, 3, #e0ac69, 2, #8d5524, 1);
}
```

## TODO

颜色已经开始去魔法数字化，尺寸和尺度也需要同样处理。后续会考虑新增 `size.css`，把间距、圆角、控件高度、字号尺度等稳定尺寸集中管理；当前这部分还没有确定规则，暂不实现。

## 构建注意事项

外部项目的构建工具需要支持从依赖包中引入 CSS。Vite、现代 Rollup、Webpack 和 Rspack 项目通常可以直接处理这种写法。

`color.css` 使用 CSS `@function`、`if()`、相对颜色语法和 OKLCH。它面向最新 Chrome，不面向旧浏览器兼容。

UIKit 发布包会把 `src/css` 原样复制到 `dist/css`，并通过 `package.json` 的 `exports` 暴露 `./css/*`。因此外部项目不应该引用 `dist` 路径，也不应该引用 UIKit 源码路径。

推荐路径：

```ts
import '@edsolater/uikit/css/reset.css'
import '@edsolater/uikit/css/color.css'
```

不要使用：

```ts
import '@edsolater/uikit/dist/css/reset.css'
import '@edsolater/uikit/dist/css/color.css'
import '@edsolater/uikit/src/css/reset.css'
import '@edsolater/uikit/src/css/color.css'
```
