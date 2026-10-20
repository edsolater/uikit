# Foundation

本目录定义 UIKit 的基础状态、响应式动作、上下文契约，并接入当前 Solid 运行时。使用这些能力的 Hooks、组件和示例从 UIKit 的入口导入，不直接引用 Solid。

- `createState/`：定义 State、StateView、Source、读取与来源转换，以及内部响应式运行机制。
- `createEffect.ts`：响应式动作、挂载和清理入口。
- `createContext.ts`：上下文创建、读取及 Provider 契约。
- `render.ts`：内部渲染与 props 接入，保留底层调度、子树复用和惰性读取。
- `types.ts`：当前渲染运行时的类型桥接；仍沿用 Solid 类型，尚未消除类型契约对运行时的依赖。
- `index.ts`：基础状态、Effect 和 Context 的公开出口；渲染接入不从包根发布。

Foundation 不依赖 Hooks 或组件。`derive`、`mapSource`、`followState`、快照与领域派生组合继续由 Hooks 提供。

生产源码中，直接引用 `solid-js` 与 `@solidjs/web` 的实现限定为本目录的 `createState/state.ts`、`createState/createReactiveRunner.ts`、`createEffect.ts`、`createContext.ts`、`render.ts`、`types.ts`。`src/types/htmlPopover.d.ts` 的第三方模块类型扩展、测试及构建配置按各自职责保留 Solid 引用。

JSX 编译器仍会在构建产物中生成 `@solidjs/web` 引用；编译器与运行时版本由构建接入管理，源码导入收口不会消除这些生成依赖。

当前接入 Solid 2。State 自持当前 JS 值，写入后立即读取当前值；依赖通知交给 Solid，派生及 DOM 更新遵循其批量提交时机。组件验收范围为 Button，其余组件与工具的已知差异记录在 [Solid 2 迁移计划](../../docs/plans/2026-10-20-Solid2迁移.md)。

`createEffect` 优先直接接收单个 Source，多个独立来源使用 tuple，无法自然表达时才使用 compute 函数。计算阶段读取依赖并产出数据，动作阶段的额外读取不增加依赖，动作返回的清理由 Solid 在下次动作前及卸载时执行。内部 DOM 监听同样采用原生两阶段；Piv 的 style 与 HTML 字段由原生 mapArray 按 key 保留作用域，换源时由同一监听清理后提交，字段退出时释放。

内部 `createRenderEffect` 使用相同三入口与优先级，共用一处来源归一化；默认首次动作同步完成，原有第三个原生选项参数继续透传。Piv 合并层复用 derive 输出稳定的 id Source，持续合并插件与直接声明；消费层直接传入该 Source，由 Effect 自动读取，不使用 getter/val 桥接。

`createReactionFn` 是独立的旧 runner 契约：创建时同步运行并缓存结果，追踪整个 action，显式释放后保留最后结果。现有 `followState` 还在 action 内写入目标 State，因此这里保留计算阶段运行整个 action 的适配，不声称它是纯计算，也不将新的 Effect 调用转入该入口。它的进一步契约改造未在本轮获得授权。
