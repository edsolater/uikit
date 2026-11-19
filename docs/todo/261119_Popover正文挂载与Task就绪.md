# Popover 正文挂载与 Task 就绪

成文日期：2026-11-19。

状态：UIKit 的显隐 Task 已使用 FNKit 的动作报告。给需要等待挂载的操作提供就绪机制，仍是独立待办。

## 取得节点后，操作可能还没就绪

Popover 的显隐 Task 等待 `domProxy` 交付正文元素，然后检查取消并调用原生显隐方法。`domProxy` 交付的是已取得的元素引用，此时元素可能还没接入 `document`。例如触发端先收到焦点事件，正文由同一轮渲染稍后接入。请求已经取得目标，浏览器执行打开所需的条件却尚未满足。

[当前显隐 Task](../../src/components/plugins/kits/Popover/popover.ts#L237) · [UIKit 的挂载边界](../../src/components/plugins/kits/Popover/SPEC.md#功能定位与当前边界)

## 现在由动作报告表达结果

正文引用到手后，具体 Task 可以直接尝试显隐，也可以按用途等待就绪。UIKit 当前尝试原生操作，再用 `reportSuccess` 报告目标是否达成。FNKit 将该报告用于计算 `TaskResult.isSuccess`。原生操作抛出的错误仍由 Task 的执行结果传递。

## 后续待办

若具体操作需要等待正文接入，UIKit 提供就绪条件及有效宿主，FNKit 提供可复用的等待与取消语义。先验证已有的 `TaskResult.cancel()` 和 `canContinue()` 能承担哪些职责，再决定要补什么契约。

有等待策略的操作应覆盖这个场景：先发起打开，再取得尚未挂载的正文，最后将正文接入文档。若等待期间已取消或退出所属作用域，旧请求不会在正文接入后执行。选择直接尝试的操作继续报告自己的实际结果。

[FNKit Task 与 Result 执行计划](../../../fnkit/docs/plans/261108_Task与Result执行.md)
