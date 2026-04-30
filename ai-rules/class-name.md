# 类名规则

## 用途

这个文件定义 class name 怎么写，以及少数特殊 class 绑定什么时候可以用。

它不讨论 TypeScript 命名、文件命名或组件拆分。这里只有一个目标：让 HTML class 一眼能读出节点身份、上下文和状态，不把命名写成噪音。

## 核心规则

先判断当前名字是不是完整语义单元。

如果几个词合在一起才代表同一个稳定对象、页面身份或角色，就写成一个 class token，内部用 `-` 连接。

如果几个词拆开后各自仍然成立，并且是在表达同一个节点同时具备多个身份，才写成多个并列 class。

不要把“可以组合”误写成“所有词都拆开”。也不要把父层已经提供的上下文在子层重复展开。

判断时不要先问“哪个写法更短”，而是先问拆开后语义是否还成立。

判断顺序是：

1. 这几个词是不是一个对象名、页面名或角色名。
2. 拆开以后，读者是否会误以为这是几个独立身份。
3. 父层或文件名是否已经提供了其中一部分上下文。

前两点成立，就保留成 `metric-card` 这类完整 token。第三点成立，就删掉重复上下文，只保留本层新增角色。

## 对象身份

class name 默认命名“这个东西本身是什么”，不命名它现在怎么被用、因为什么出现、处在什么临时状态。

合适：

- `tooltip`
- `card`
- `panel`
- `chart-panel`

不合适：

- `hover-tooltip`
- `click-card`
- `temporary-panel`

如果确实需要表达状态，使用状态类、伪类、属性选择器或上层条件上下文，不把状态焊进对象名。

## 完整词元

以下情况默认保留成一个 token：

- URL slug 或页面身份
- 拆开后就不再是同一个对象的复合名词
- 拆开后会让边界变松的角色名

例如：

- `ml-response`
- `order-history`
- `metric-card`
- `series-label`
- `route-card`

这些名字拆开不是更清楚，而是丢掉了原本的语义边界。

## 组合类名

只有当每个词拆开后仍然是当前节点的真实身份时，才并列书写。

例如：

- `app shell`
- `chart container`
- `tab nav`
- `link --active`
- `status --error`

这里的重点是“同一个节点同时具备这些身份”。如果只是父层上下文已经成立，子节点不应继续重复父层领域词。

“真实身份”必须能单独回答这个节点是什么。

例如 `chart container` 可以拆开，是因为这个节点既属于 chart，又是 container。

`metric card` 不应拆开，因为 `metric` 不是这个节点的并列身份，它只是限定这张卡片属于哪类内容；拆开后会让 `metric` 看起来像一个可复用基础类。

## 上下文规则

一旦父层建立了领域，子层默认只写本层新增角色。

例如页面根节点是 `ml-response dashboard`，内部更合适的是：

- `chart-panel`
- `chart-header`
- `status`
- `value-chart`

而不是：

- `ml-response-chart-panel`
- `ml-response-status`

组件自有文件也天然提供上下文。比如 `PointTooltip.tsx` 的根节点是 `tooltip`，内部节点可以直接叫：

- `label`
- `value`
- `meta`

不要写成：

- `tooltip-label`
- `tooltip-value`
- `tooltip-meta`

## 基础单元

基础单元名必须短、白话、具象，并且能被立刻想象出来。

例如：

- `card`
- `panel`
- `label`
- `value`
- `control`
- `field`
- `status`

如果业务类名已经稳定落在某个基础单元上，不要再重复挂同义基础类。

合适：

```html
<article class="metric-card"></article>
```

不合适：

```html
<article class="metric-card card"></article>
```

基础层如果要兼容 `metric-card` 这类后缀，应由 CSS 选择器承担，不让 HTML 重复说两遍。

基础单元进入共享层前要再过一遍筛选：

1. 它是否经常作为后缀出现在完整类名里，例如 `route-card`、`metric-card`。
2. 它脱离当前页面后是否仍然能被读懂。
3. 它是否足够短，不需要解释才能想象。

三点都成立，才适合成为基础单元。像 `eyebrow`、`summary-text` 这类词即使能匹配，也不够稳定，不应进入基础兼容绑定。

## 状态规则

状态类统一写成 `--state`。

例如：

- `status --error`
- `link --active`
- `button --disabled`

不要写：

- `status error`
- `link active`
- `button disabled`

双杠让读者一眼知道这是附着在主体上的状态，不是一个新的普通语义节点。

## 样式嵌套

默认用 CSS nesting 表达上下文，而不是把父层词重复写进每个子 class。

推荐：

```css
.ml-response.dashboard {
  .chart-panel {
    .chart-header {
      .series-label {
      }
    }
  }
}
```

不推荐：

```css
.ml-response-chart-panel {
}

.ml-response-chart-header {
}
```

嵌套本身就是上下文。不要把已经存在的结构再编码进每一个名字里。

## 特殊绑定

普通命名已经足够时，不要进入特殊绑定。

只有两类场景允许特殊 class 绑定：

- typed value binding：把 HTML 属性值接进 CSS typed custom property
- base unit compatibility binding：让基础样式兼容稳定后缀类名

如果只是给一个节点命名，不需要特殊绑定。

特殊绑定的判断标准是：这个 class 是否还承担了“连接两套系统”的职责。

- `.--a` 连接 HTML 属性、CSS 变量和 `@property` 类型声明。
- `[class*="-card"]` 连接业务完整类名和基础样式单元。

没有这种连接关系，就回到普通 class name 规则。

### 类型值绑定

一条 typed value 通道必须一一对应：

- `@property --a`
- `data-state-a`
- `.--a`
- `--a: attr(data-state-a type(<number>), 1)`

示例：

```css
@property --a {
  syntax: "<number>";
  initial-value: 1;
  inherits: false;
}

.--a {
  --a: attr(data-state-a type(<number>), 1);
  opacity: calc(0.3 * var(--a));
}
```

```html
<div class="chart-container --a" data-state-a="2"></div>
```

这种短名只在特殊绑定内部成立，不能扩散成普通业务 class 命名方式。

### 基础兼容绑定

基础兼容绑定只允许接住稳定基础后缀。

推荐：

```css
[class*="-card"],
.card {
  display: flex;
  flex-direction: column;
}
```

这里表达的是：所有稳定落在 card 单元上的完整类名，都接入 card 基础样式。

只允许：

- `.card`
- `[class*="-card"]`
- `[class*="-panel"]`

不要用裸匹配：

- `[class*="card"]`

裸匹配会把开头 namespace 也吞进去，边界太脏。

不要用兼容绑定匹配含糊、抽象或作者私有的词，例如 `eyebrow`、`summary-text`。

## 禁止写法

禁止：

- `ml response dashboard`
- `metric card`
- `metric label`
- `tooltip-label`
- `ml-response-status`
- `metric-card card`
- `status error`
- `link active`
- `hover-tooltip`
- 把 `.--a` 当普通业务 class 用
- `@property --a`、`data-state-b`、`.--c` 三者不一致
- 在业务层随手写 `[class*="..."]`
- 用 `[class*="card"]` 这种裸匹配做基础兼容

## 检查清单

- 名字是否先区分了完整语义单元和可组合角色
- 页面身份词是否保留了 URL slug 级别的完整性
- 父层上下文是否没有被子层重复展开
- 组件内部子节点是否相信组件文件和根 class 提供的上下文
- 状态类是否统一写成 `--state`
- 特殊绑定是否只用于真正需要的绑定场景
- 基础兼容后缀是否短、白话、稳定、可连接
