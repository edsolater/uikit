# CSS 契约

## 用途

这个文件定义 CSS 怎么按结构、variant、state 和属性顺序书写。
它不重新定义 HTML 命名边界；HTML 命名以 `class-name.md` 为准。

核心目标是让 CSS 阅读顺序贴近 DOM 结构：先看到主体是谁，再看到它的分类和状态，最后进入子节点环境。

## 四个概念

```txt
class 定身份。
data-variant 定分类。
data-state 定状态。
CSS nesting 定环境。
```

CSS 里对应成：

```css
.subject {
  &[data-variant="kind"] {
  }

  &[data-state="state"] {
  }

  .child {
  }
}
```

## 结构顺序

同一个节点内部按这个顺序写：

```txt
主体基础
主体 variant
主体 state
子元素
子元素 variant
子元素 state
```

示例：

```css
.tabs {
  /* tabs 基础 */

  &[data-variant="line"] {
    /* tabs 分类 */
  }

  &[data-state="loading"] {
    /* tabs 状态 */
  }

  .item {
    /* item 基础 */

    &[data-variant="primary"] {
      /* item 分类 */
    }

    &[data-state="active"] {
      /* item 状态 */
    }
  }
}
```

不要已经进入子元素后，又回头补主体的 variant 或 state。

## nesting

CSS nesting 表达“这个东西处在哪个环境里”。

推荐：

```css
.tabs {
  .list {
    .item {
    }
  }

  .panel {
  }
}
```

不推荐：

```css
.tabs {
}

.tabs-list {
}

.tabs-item {
}

.tabs-panel {
}
```

环境已经存在于结构里，不要再编码进每一个 class 名。

默认不写 `>`。只有必须排除更深后代时，才使用直属子选择器。

## variant

variant 样式只挂在当前主体的 `data-variant` 上。

推荐：

```css
.button {
  &[data-variant="solid"] {
  }

  &[data-variant="ghost"] {
  }
}
```

不推荐：

```css
.button.solid {
}

.solid-button {
}
```

variant 是分类，不是新身份。

## state

state 样式只挂在当前主体的 `data-state` 上。

推荐：

```css
.item {
  &[data-state="active"] {
  }

  &[data-state="inactive"] {
  }
}
```

不推荐：

```css
.item.active {
}

.item.--active {
}

.active-item {
}
```

state 是现状，不是 class。

伪类仍然保留给浏览器交互态，例如 `:hover`、`:focus-visible`、`:active`。当状态来自组件数据、业务流程或持久选择结果时，使用 `data-state`。

## 条件查询

条件查询就近放在实际变化的节点里。

优先顺序：

1. 先用 `clamp()`、`min()`、`max()`、`minmax()`、`%`、`fr`、`dvw`、`dvh`、flex 和 grid 的自然伸缩解决。
2. 如果变化取决于组件容器，用 `@container`。
3. 只有布局语义真的随视口阶段切换时，才用 `@media`。

推荐：

```css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(8px, 2dvw, 16px);

  @container (width < 360px) {
    align-items: stretch;
  }
}
```

不要把所有 `@media` 堆到文件尾部，也不要把可以连续变化的问题写成断点跳变。

## CSS 属性顺序

同一个规则块内，属性按语义从外到内、从结构到表现排列：

```txt
位置
布局
尺寸
盒子
文字
外观
交互
动画
```

示例：

```css
.item {
  position: relative;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  min-height: 36px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 8px;

  font: inherit;
  color: var(--text-2);

  background: transparent;
  opacity: 1;

  cursor: pointer;

  transition:
    color 160ms ease,
    background 160ms ease,
    border-color 160ms ease;

  &[data-state="active"] {
    color: var(--text-1);
    border-color: currentColor;
  }
}
```

属性顺序服务阅读，不服务机械排序。遇到强相关属性时，允许就近放在一起，例如 `border` 和 `border-radius`。

## 基础样式与业务样式

基础样式回答“这个稳定单元默认是什么”。
业务样式回答“它在当前页面里具体怎么摆、怎么强调、怎么修饰”。

适合沉淀到基础样式的身份：

- `card`
- `panel`
- `label`
- `value`
- `control`
- `field`
- `status`

业务专属颜色、具体间距、当前页面密度、某个图表高度、某个布局的强调方式，不要反向塞回基础样式。

## 固定单位

不是所有尺寸都要响应式。

这些稳定视觉细节可以继续使用 `px`：

- 边框粗细
- 小图标尺寸
- 小圆角
- 阴影细节
- 很小的内边距

如果一个值是稳定视觉细节，不要为了“响应式”硬改成比例单位。

## 禁止写法

- 用 `.button.primary` 表达 variant
- 用 `.button.--active` 表达 state
- 用 `.active-button` 表达 state
- 用 `.tabs-item` 重复父层环境
- 进入子元素后又回头补主体 state
- 一遇到响应式就先写 `@media`
- 把所有条件查询堆到文件尾部
- 把下层独立组件的样式写进父容器 CSS
- 把业务专属参数沉淀进基础样式

## 检查清单

- CSS 是否沿 DOM 结构 nesting
- 当前主体是否先写基础，再写 variant，再写 state
- 子元素是否只写自己的身份、variant 和 state
- 分类是否统一使用 `[data-variant="..."]`
- 状态是否统一使用 `[data-state="..."]`
- 属性是否大致按位置、布局、尺寸、盒子、文字、外观、交互、动画排列
- 响应式是否先尝试连续表达和容器查询
