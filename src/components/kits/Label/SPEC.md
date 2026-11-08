# Label

- Label 表达字段标题，并通过 `for` 指向另一个组件拥有的原生表单控件。它不创建输入，不持有输入值，也不提交表单。
- `children` 接收标题文字的 Source；`for` 接收目标控件的 ID；`tooltip` 复用 Piv children 的可渲染内容契约，接受字符串、JSX 模板及其 Source。未提供说明或说明为空时，只显示标题。
- 有说明时，标题后显示小问号按钮。原生 `label` 与问号按钮为兄弟，按钮固定 `type="button"`，点击标题仍聚焦 `for` 指定的控件。
- 鼠标悬停问号或键盘聚焦问号时显示说明；鼠标可以移入说明继续阅读，离开问号与说明且不再聚焦时关闭。Escape 关闭后，保持当前焦点而不立即重新打开；移出后再次进入可重新打开。
- `tooltip`是末尾 Help 组件的快捷接入；Help 再使用通用 tooltip 插件。其他位置可以独立使用 Help，或将插件挂在自己的宿主上。`tooltipTrigger`传给 Help，只替换问号内的显示内容，不放另一个可交互按钮；Source清空时回到问号。
- 内容可为字符串、组件或小文章，形式自由；语义是简短补充说明，不代替正文。不设字数校验或内容解析协议。
- 说明以原生 Popover API 显示在 top layer，通过 CSS Anchor Positioning 优先放在问号上方，空间不足时由浏览器换边。说明不撑开布局，不覆盖其关联输入；问号与输入各自可操作。
- 问号提供说明用途的无障碍名称，并以 `aria-describedby` 关联 `role="tooltip"` 的说明。Label 的 `for` 只关联输入，不把问号纳入原生 label。
- 所有 DOM 通过 Piv 创建，Label 与 Help 分别通过 kit 声明透明组件边界。Label 拥有字段标题与排列，Help 拥有问号及其样式；tooltip 复用 createPopoverPlugins 的原生显隐与定位，并拥有单一 Piv 提示正文、提示材料和阅读交互，不增加独立 Surface 组件身份。组件定位框开启时隐藏原文字，保留排版。
- Label 不解释业务文案，不访问业务数据，也不感知 NumberInput、控制参数、拖动或输入有效性。

- Label 通过 kit 管理透明边界与可选组件 ref。初始状态用 Props；特殊运行期需求可接收 LabelController，通过其 `.props` 下的原字段 State 修改标题、关联目标与说明，包括原来未声明的 tooltip。Label.controllers 仅收集接入 ref 的当前实例，销毁后移除；ref 不属于可写字段。
