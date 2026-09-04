# 主题颜色系统

## 一句话

```txt
base 负责可覆盖 seed
dye 负责生成色元
color 负责组件可用语义
组件自身再做局部 token 映射
```

当前裁决：

```txt
基础视觉语义：canvas / surface / fg / line
语气后缀：soft / strong
层级后缀：low / high
状态后缀：hover / active / disabled / focus
状态绝对色域：base-status-good / base-status-bad / base-status-warn / base-status-info
主题命名：data-theme 表示解析后的当前主题，CSS 直接用选择器覆盖对应主题分支的 token
```

## 分层

### `--base-*`

`base` 只放可覆盖的基础 seed。

```css
--base-brand: oklch(58% 0.2 260);

--base-status-good: oklch(62% 0.16 145);
```

原则：

```txt
base 不给组件直接使用
base 主要用于生成 dye
base-status 是状态绝对色域，不从 brand 派生
默认 :root 只写亮色 token，暗色 token 以后落到 :root[data-theme='dark'] 覆盖块
```

主题覆盖入口：

```css
:root {
  --color-canvas: oklch(94.5% 0.006 260);
  --color-surface: oklch(98% 0.003 260);
}

:root[data-theme='dark'] {
  --color-canvas: oklch(13% 0.01 260);
  --color-surface: oklch(17% 0.012 260);
}
```

主题切换不通过颜色函数分支表达；普通 CSS 层叠就是主题分支机制。

### `--dye-*`

`dye` 是色元层，负责“颜色从哪里来”。

核心色元：

```css
--dye-brand
--dye-action
--dye-action-hover
--dye-action-active

--dye-accent
--dye-accent-soft
--dye-accent-strong

--dye-ink
--dye-paper
--dye-neutral-0
--dye-neutral-1
--dye-neutral-2
```

原则：

```txt
dye 层不写组件用途
neutral 用数字表达阶梯
数字越大越接近 ink
数字越小越接近 paper
neutral 承担程度语义
程度的一个重要表现，是同种类中的层级语义
当前 neutral 只定义亮色曲线
```

### `--color-*`

`color` 是应用和组件可用的基础语义层，负责“界面怎么用”。

原则：

```txt
应用和组件优先吃 color，不直接吃 dye
```

## 色元故事

### `brand`

```css
--dye-brand: var(--base-brand);
```

理解：

```txt
brand 是品牌身份色元
brand 也是 action / accent 的上游基础色元
当前 :root 只写亮色 brand，暗色 brand 以后由 :root[data-theme='dark'] 覆盖
```

### `action`

```css
--dye-action: var(--dye-brand);

--dye-action-hover: --color-adjust(
  var(--dye-action),
  darker, 4%,
  vivid, 0.01
);

--dye-action-active: --color-adjust(
  var(--dye-action),
  darker, 8%,
  grayish, 0.01
);
```

理解：

```txt
action = 可操作入口
hover = 兴趣态 / 靠近
active = 按下态 / 压实
亮色 action 从 rest 到 hover 到 active 逐步变深，避免主按钮 hover 变飘
```

### `accent`

```css
--dye-accent: --color-adjust(
  var(--dye-brand),
  hue-backward, 18deg,
  lighter, 4%,
  vivid, 0.01
);

--dye-accent-soft: --color-adjust(
  var(--dye-accent),
  opacity, 14%
);

--dye-accent-strong: --color-adjust(
  var(--dye-accent),
  lighter, 8%,
  vivid, 0.02
);
```

理解：

```txt
accent = 当前态 / 选中态 / 聚焦态 / 系统强调
accent 不是 action
accent 应该和 action 拉开一点色相
```

### `ink / paper`

```css
--dye-ink: black;
--dye-paper: white;
```

理解：

```txt
ink = 亮色模式下的锐利墨色极点
paper = 亮色模式下的锐利纸色极点
ink / paper 不直接使用，只参与组合
```

### `neutral`

`neutral` 是直接定义的中性色阶曲线。

默认 `:root` 维护亮色曲线。暗色曲线写在 `:root[data-theme='dark']` 覆盖块里。

命名用数字，不用用途词：

```css
--dye-neutral-0
--dye-neutral-1
--dye-neutral-2
--dye-neutral-3
--dye-neutral-4
--dye-neutral-5
--dye-neutral-6
--dye-neutral-7
--dye-neutral-8
```

约定：

```txt
neutral-0 最接近 paper
neutral-8 最接近 ink
数字越大，前景压强越高
neutral 是层级材料，不是 soft 的默认底料
neutral 不直接给组件使用，而是映射到 canvas / surface / fg / line 等 color 语义
neutral-0 也不使用纯白，避免界面只剩纯白和灰边
```

neutral 主要服务结构层级：

```txt
canvas / surface 的画布和承载面层级
fg 的默认、次要、高权重前景压强
line 的默认、弱、强边界压强
```

不要为了让语义色“变淡”而机械混入 `dye-neutral-*`。如果某个颜色需要 `soft`，先判断它是否真的需要表达低语气信息。

不要在亮色曲线里提前塞暗色逻辑。暗色曲线必须在 `:root[data-theme='dark']` 里单独设计。

### `status absolute`

状态绝对色域使用独立 seed，不从 brand 主派生。

```css
--base-status-good: oklch(62% 0.16 145);
--base-status-bad: oklch(58% 0.2 28);
--base-status-warn: oklch(72% 0.17 78);
--base-status-info: oklch(62% 0.16 235);

--dye-good: --color-mix(
  var(--base-status-good),
  94,
  var(--dye-brand-flavor),
  6
);
```

理解：

```txt
状态绝对色首先是稳定语义色，不是品牌身份色
bad 不能因为品牌是绿色就变成绿色系错误
good / bad / warn / info 可以接受少量品牌气息调和
品牌气息只负责融入系统氛围，不改写状态色相本体
base-status 只负责绝对语义锚点
当前 :root 只写亮色状态色，暗色状态色以后由 :root[data-theme='dark'] 覆盖
dye-status 负责亮色主题调和
color-status 负责组件可用语义
```

## `--color-*` 命名体系

基础视觉语义采用：

```txt
canvas / surface / fg / line
```

其中仍以三类 UI 材料为主体：

```txt
surface / fg / line
```

不采用：

```txt
bg / text / content
```

原因：

```txt
canvas 表达页面或应用的最底层画布
surface 比 bg 更像“承载面”
fg 比 text/content 更抽象，覆盖文字、图标、SVG、glyph
line 覆盖 border、divider、outline、separator
```

## `--color-*` 分类

### Structure

```css
--color-canvas;

--color-surface;
--color-surface-low;
--color-surface-high;
--color-surface-overlay;
--color-surface-inverse;

--color-fg;
--color-fg-soft;
--color-fg-strong;
--color-fg-disabled;
--color-fg-inverse;

--color-line;
--color-line-soft;
--color-line-strong;
--color-line-focus;

```

解释：

```txt
canvas           页面或应用的最底层画布 / body 背景，默认退到 surface 后面
surface          组件、卡片、面板和局部区块的干净承载面
surface-low      低层级承载面 / 弱区块
surface-high     高层级承载面 / 抬升面 / menu / popover
surface-overlay  遮罩层 / 固定使用黑色压暗材料
surface-inverse  反相承载面

fg               默认前景内容
fg-soft          次要前景内容 / 低语气信息
fg-strong        高权重前景内容 / 高语气信息
fg-disabled      禁用前景
fg-inverse       反相前景

line             默认边界
line-soft        弱边界 / 低语气边界
line-strong      强边界 / 高语气边界
line-focus       中性 focus ring

control          中性可操作控件的默认承载面
control-hover    中性控件兴趣态承载面
control-active   中性控件按下态承载面
control-disabled 中性控件禁用承载面
control-fg       中性控件前景
control-line     中性控件边界

field            可编辑值承载面
field-hover      字段兴趣态承载面
field-focus      字段聚焦承载面
field-disabled   字段禁用承载面
field-fg         字段输入内容前景
field-placeholder 字段占位前景
field-line       字段默认边界
field-line-focus 字段聚焦边界
field-focus-ring 字段聚焦外环
```

`surface-low/high` 表达同类承载面的层级。不要把承载层级命名成 `surface-soft` 或 `surface-strong`。

`canvas` 和 `surface` 不应默认相同。亮色模式里 surface 比 canvas 更白，但 surface 也不使用纯白。

暗色模式下：

```txt
canvas 是最暗的 app 底色
surface 比 canvas 亮一层，用来承载卡片和面板
surface-low 回到 canvas 附近，用于凹陷区和弱区块
surface-high 比 surface 再亮一层，用于菜单、浮层和更高承载面
```

暗色卡片不靠白色光晕表达层级。卡片和 app 底色的分离先靠 surface 明度，再靠线和黑色阴影补充。

### Shadow / Backdrop

```css
--color-shadow;
--color-backdrop;
--shadow;
--shadow-0;
--shadow-1;
--shadow-2;
--shadow-3;
--shadow-4;
--shadow-5;
--shadow-6;
--shadow-7;
--shadow-8;
--shadow-card;
--shadow-card-raised;
--shadow-popover;
--shadow-dialog;
```

理解：

```txt
shadow 和 backdrop 是物理材料，不是 fg 或 ink 的语义延伸
亮色 shadow 必须轻，避免在白面周围形成灰雾
暗色 shadow 可以更重，但仍使用黑色投影，不使用白色光晕
backdrop 是遮罩材料，用于 dialog、popover 背景压暗和模态层
shadow-0 到 shadow-8 是层级 ramp
组件优先消费 shadow-card、shadow-popover、shadow-dialog 这类语义 token
```

### Brand

```css
--color-brand;
--color-brand-soft;
--color-brand-strong;
--color-brand-fg;
--color-brand-line;
```

理解：

```txt
brand 是身份色
只用于 logo / brand mark / 品牌装饰 / 少量品牌区域
不承担普通交互职责
```

### Action

```css
--color-action;
--color-action-hover;
--color-action-active;
--color-action-disabled;

--color-action-fg;
--color-action-line;
```

可选独立 link：

```css
--color-link;
--color-link-hover;
--color-link-active;
--color-link-visited;
```

理解：

```txt
action = 可操作入口
button / command / clickable item 默认从 action 取色
link 如果高频，独立成 link 角色更清楚
```

### Accent

```css
--color-accent;
--color-accent-soft;
--color-accent-strong;

--color-accent-fg;
--color-accent-line;
--color-accent-focus;
```

理解：

```txt
accent         checked / switch-on / progress-filled
accent-soft    selected item background / active nav background / 低语气强调
accent-strong  active indicator / high emphasis marker / 高语气强调
accent-fg      selected nav fg / active tab fg
accent-line    selected border / underline
accent-focus   focus ring
```

### Status

统一使用：

```txt
默认名 / soft / fg / line
```

```css
--color-good;
--color-good-soft;
--color-good-fg;
--color-good-line;

--color-bad;
--color-bad-soft;
--color-bad-fg;
--color-bad-line;

--color-warn;
--color-warn-soft;
--color-warn-fg;
--color-warn-line;

--color-info;
--color-info-soft;
--color-info-fg;
--color-info-line;
```

理解：

```txt
good  成功 / 正向 / 完成
bad   错误 / 危险 / 删除 / 负向
warn  警告 / 风险 / 待确认
info  信息 / 提示 / 中性系统消息
```

## 命名规则

当前推荐：

```txt
--color-{role}-{slot?}-{state?}
```

实际落地时更像：

```txt
--color-{role}
--color-{role}-{variant}
```

其中：

```txt
role:
canvas / surface / fg / line / brand / action / accent / link / good / bad / warn / info

variant:
soft / strong / low / high / overlay / inverse / hover / active / disabled / focus / fg / line / placeholder
```

关键统一点：

```txt
soft 不用 weak/subtle/muted
fg 不用 text/content
默认态不加 base / normal / default 后缀
soft / strong 是语气，不是层级
low / high 是同种类中的层级语义
```

## 当前裁决

保留：

```txt
canvas / surface / fg / line
soft
low / high
dye-neutral-数字阶梯
dye-ink / dye-paper
base-status 状态绝对色域
```

不要用：

```txt
text 作为底层前景色
content 作为颜色 role
weak / subtle / muted
dye-surface-color / surface / fg 这种用途词
在亮色 neutral 曲线里提前塞暗色逻辑
blackwhite 这种物理拼接词
从 brand / accent 主派生 good / bad / warn / info
用 soft / strong 表达承载面层级
为了让语义色变淡而机械混入 neutral
```

## 组件局部 token

组件内部可以继续建立局部 token，例如：

```css
.Button {
  --Button-bg: var(--color-action);
  --Button-fg: var(--color-action-fg);
  --Button-border-color: var(--color-action-line);
}
```

组件局部 token 的职责是把全局 `--color-*` 映射到组件内部结构，不应该重新发明全局颜色语义。
