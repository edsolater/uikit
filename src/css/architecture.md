# CSS 架构

## 核心判断

UIKit CSS 不再把 `--color(text)`、`--space(5)` 这类 `@function` 翻译层作为公开消费入口。

原因是公开入口越像自定义语言，后续维护的性质负担越重。CSS 已经有标准的自定义属性和 `var()`，组件、页面和业务样式应直接消费裸 CSS 变量：

```css
.panel {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
  padding: var(--space-5);
  border-radius: var(--radius-4);
}
```

## 分层

```txt
第一层：工具函数
  使用 @function、color-mix、pow、round 等现代 CSS 能力生成材料。
  工具函数只服务 CSS 文件内部或新的变量定义，不作为组件公开消费习惯。

第二层：源参数与公开变量
  :root 同时承载可覆盖源参数和可直接 var() 消费的公开变量。
  组件和业务通过 var(--*) 消费公开变量。
```

## Layer

```txt
reset
  浏览器重置和排版基线。

style-token
  颜色和尺寸的函数、源参数与公开变量。

controls
  浏览器内置控件的轻量外观清洗。

traits
  trait plugin 自动附加到 DOM 上的功能类。
```

`all-base.css` 负责声明这组 layer 的顺序，并汇总各个基础 CSS 入口。

## 文件职责

`reset.css` 只负责浏览器默认样式重置，不处理 controls 控件美化。

`all-base.css` 负责基础 CSS 的整包入口。外部项目如果不想逐个引入多个碎片文件，可以只引入这一个文件。

`controls.css` 负责浏览器内置控件的轻量外观清洗。这里的 controls 表示小空间里的内置交互单元，例如 `button`、`input`、`textarea`、`select`、`progress`、`meter` 和 `dialog`。它默认提供固定科技蓝 `--color-accent`，业务可以覆盖。

`traits.css` 负责 trait plugin 自动附加到 DOM 上的功能类。它只收纳效果非常单一、语义非常稳定、但又不值得上升成组件身份或主题 token 的正交小能力，不承担页面布局组合或视觉主题，也不是给业务层手写 utility class 的仓库。

`color.css` 和 `dimension.css` 共同构成 `style-token` 层。它们保留颜色和尺寸函数，但公开消费入口仍然是 `var(--color-*)`、`var(--space-*)`、`var(--size-*)`、`var(--radius-*)`、`var(--boundary-*)`。

## 公开消费规则

组件 CSS 和业务 CSS 优先使用：

```css
var(--color-text)
var(--color-background)
var(--color-surface)
var(--color-border)
var(--color-brand-fill)
var(--color-on-brand)

var(--space-4)
var(--size-3)
var(--radius-4)
var(--boundary-1)
```

不要把公开样式写成：

```css
--color(text)
--space(4)
--size(3)
--radius(4)
--boundary(1)
```

## TSX 和 CSS 边界

TSX / HTML 负责表达信息身份、意图、权重和状态。

CSS 负责把这些语义落成视觉形式。

公开视觉值使用标准 `var()`。这样即使 AI 或开发者按 CSS 常规习惯书写，也会自然落到正确路径上。
