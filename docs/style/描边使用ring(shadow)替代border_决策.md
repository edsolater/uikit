# Button 描边使用 shadow 替代 border

## 背景

Button 在 tone、hover、active 等状态切换时，需要同时变化背景和描边。

如果描边直接使用 `border`，在过渡过程中容易出现视觉抖动。问题通常不是 `border-width` 本身变化，而是控件边界参与布局和像素对齐后，在切换时更容易让界面产生“震动感”。

## 决策

当前只对 Button 组件采用以下策略：

- 真实 `border` 设为 `none`
- 用 `inset box-shadow` 模拟 1px 描边
- tone 相关状态只改描边颜色变量，不再直接驱动 `border`
- 过渡时动画 `box-shadow`，不动画 `border-color`

示意：

```css
.Button {
  --Button-border-color: transparent;
  --Button-border-shadow: inset 0 0 0 1px var(--Button-border-color);

  border: none;
  box-shadow: var(--Button-border-shadow);
  transition: box-shadow 120ms ease;
}
```

## 原因

- `box-shadow` 不参与布局，切换描边颜色时不会带来布局抖动
- Button 的边界变化仍然可以保持和原来相同的视觉语义
- 这次需求只针对 Button，先在单组件内验证体验，不提前把规则推广到其他控件

## 当前范围

本决策当前只覆盖 Button：

- [src/components/Button/button.css](src/components/Button/button.css)

Input、Popover 或共享 controls 层暂时不跟进这条规则，等后续整理控件边界策略时再统一处理。

## 后续

如果后续多个控件都确认采用同样方案，再把这条规则上提为 UIKit 的共享控件设计约定，而不是继续停留在 Button 层。