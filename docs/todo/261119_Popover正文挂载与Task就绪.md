# Popover 正文挂载与 Task 就绪

成文日期：2026-11-19。

状态：已完成。Popover 的打开请求等待正文挂载，Tooltip 复用这条打开流程。

## 取得节点后，操作可能还没就绪

`domProxy` 交付正文元素时，元素可能还没接入文档。例如触发端先收到焦点事件，正文由同一轮渲染稍后接入。程序打开需要等到正文实际挂载。

[Popover 打开入口](../../src/components/plugins/kits/Popover/popover.ts#L257) · [UIKit 的挂载边界](../../src/components/plugins/kits/Popover/SPEC.md#功能定位与当前边界)

## 挂载等待的接入方式

Popover 的打开 Task 使用 `domTask({ getDom, waitForAttachment: true, getAction })`。每次执行由 `getDom()` 取得正文代理，等 `isReady()` 确认挂载后，由 `getAction(body)` 生成本次动作。关闭和切换在取得正文后直接尝试原生操作。显隐是否达成通过 `TaskResult.isSuccess` 获取，原生操作抛出的错误通过 `result` 传递。

[domTask 实现](../../src/components/tools/domTask.ts)

## 等待期间的取消与退出

打开请求在取得正文前、取得正文但尚未挂载时，都可用 `TaskResult.cancel()` 取消。取消原因会传给调用方；正文所属作用域先退出则正常结束并报告 `false`。

Tooltip 清空内容、主动关闭或执行延迟关闭时会撤销尚在等待的显示请求，避免正文稍后接入时被旧请求打开。

[FNKit Task 与 Result 执行计划](../../../fnkit/docs/plans/261108_Task与Result执行.md)
