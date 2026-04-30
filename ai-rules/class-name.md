# class name 契约

## 用途

这个文件定义 HTML 上的 `class`、`data-variant` 和 `data-state` 怎么写。
它不讨论 TypeScript 命名、文件命名、CSS 属性顺序或组件拆分。

核心目标只有一个：让 HTML 节点一眼能读出“它是谁、是哪一种、现在怎样”，但不要把环境、状态和分类都塞进 class 名字里。

## 四个概念

```txt
class 定身份。
data-variant 定分类。
data-state 定状态。
CSS nesting 定环境。
```

更短地说：

```txt
class 是名字。
variant 是品类。
state 是现状。
nesting 是环境。
```

## class

`class` 只回答“这个东西是谁”。

合适：

- `tabs`
- `list`
- `item`
- `panel`
- `button`
- `icon`
- `label`
- `value`

不合适：

- `line-tabs`
- `active-item`
- `disabled-button`
- `tabs-panel`
- `button-primary`

`class` 不表达它是哪一种、不表达它现在是什么状态，也不重复父层已经给出的环境。

## data-variant

`data-variant` 回答“这个东西是哪一种”。

它适合表达稳定分类、视觉品类、尺寸品类、密度品类这类同一个主体的不同样式版本。

合适：

```html
<div class="tabs" data-variant="line"></div>
<button class="button" data-variant="ghost"></button>
<section class="panel" data-variant="compact"></section>
```

不合适：

```html
<div class="line-tabs"></div>
<button class="button ghost"></button>
<section class="compact-panel"></section>
```

分类不是新身份。不要为了表达 variant 再加一个并列 class，也不要把 variant 焊进主体名。

## data-state

`data-state` 回答“这个东西现在怎样”。

它适合表达会随交互、流程或运行结果变化的状态。

合适：

```html
<button class="item" data-state="active"></button>
<button class="button" data-state="disabled"></button>
<section class="panel" data-state="loading"></section>
```

不合适：

```html
<button class="item active"></button>
<button class="button --disabled"></button>
<section class="loading-panel"></section>
```

状态不是身份。旧写法里的 `--active`、`is-active`、`active-item` 统一收口到 `data-state="active"`。

如果一个节点需要同时表达多个状态，优先重新审视状态模型。确实存在多个独立状态轴时，使用明确字段，例如 `data-open-state`、`data-load-state`，不要把多个状态塞进一个 class 字符串。

## CSS nesting

环境由 CSS nesting 表达，不由子节点 class 重复表达。

合适：

```html
<div class="tabs" data-variant="line">
  <div class="list">
    <button class="item" data-state="active">概览</button>
  </div>
</div>
```

```css
.tabs {
  .list {
    .item {
    }
  }
}
```

不合适：

```html
<div class="tabs" data-variant="line">
  <div class="tabs-list">
    <button class="tabs-item" data-state="active">概览</button>
  </div>
</div>
```

父层已经说明了环境，子层只写本层新增身份。

## 完整语义单元

如果几个词合在一起才是一个稳定对象名，就保留成一个 class token。

合适：

- `metric-card`
- `order-history`
- `route-card`
- `series-label`

这些名字拆开后不是更清楚，而是丢掉了原本的对象边界。

但不要把 variant 或 state 伪装成完整语义单元。

不合适：

- `primary-button`
- `active-tab`
- `loading-panel`
- `line-tabs`

这些应该分别写成：

```html
<button class="button" data-variant="primary"></button>
<button class="tab" data-state="active"></button>
<section class="panel" data-state="loading"></section>
<div class="tabs" data-variant="line"></div>
```

## 并列 class

并列 class 只用于同一个节点确实同时拥有多个稳定身份。

合适：

```html
<main class="app shell"></main>
<nav class="tab nav"></nav>
```

不合适：

```html
<button class="button primary"></button>
<button class="item active"></button>
<article class="metric-card card"></article>
```

`primary` 是分类，应该进 `data-variant`。
`active` 是状态，应该进 `data-state`。
`metric-card` 已经完整表达 card 身份，不需要再重复挂 `card`。

## 写法示例

```html
<div class="tabs" data-variant="line">
  <div class="list">
    <button class="item" data-state="active">
      概览
    </button>

    <button class="item" data-state="inactive">
      设置
    </button>
  </div>

  <section class="panel" data-state="active">
    概览内容
  </section>
</div>
```

## 禁止写法

- 用 `primary-button` 表达分类
- 用 `active-item` 表达状态
- 用 `item active` 表达状态
- 用 `button --disabled` 表达状态
- 用 `tabs-item` 重复父层环境
- 用 `metric-card card` 重复基础身份
- 把环境词、分类词、状态词一起塞进 class

## 检查清单

- `class` 是否只表达节点身份
- 分类是否进入了 `data-variant`
- 状态是否进入了 `data-state`
- 父层环境是否交给 CSS nesting，而不是写进子节点 class
- 完整对象名是否保留成一个 token
- 并列 class 是否真的代表多个稳定身份
