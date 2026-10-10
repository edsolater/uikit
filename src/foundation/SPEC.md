# Foundation

本目录定义 UIKit 的基础状态、响应式动作、上下文契约，并接入当前 Solid 运行时。使用这些能力的 Hooks、组件和示例从 UIKit 的入口导入，不直接引用 Solid。

- `createState/`：定义 State、StateView、Source、读取与来源转换，以及内部响应式运行机制。
- `createEffect.ts`：响应式动作、挂载和清理入口。
- `createContext.ts`：上下文创建、读取及 Provider 契约。
- `render.ts`：内部渲染与 props 接入，保留底层调度、子树复用和惰性读取。
- `types.ts`：当前渲染运行时的类型桥接；仍沿用 Solid 类型，尚未消除类型契约对运行时的依赖。
- `index.ts`：基础状态、Effect 和 Context 的公开出口；渲染接入不从包根发布。

Foundation 不依赖 Hooks 或组件。`derive`、`mapSource`、`followState`、快照与领域派生组合继续由 Hooks 提供。

生产源码中，直接引用 `solid-js` 及其子路径的实现限定为本目录的 `createState/state.ts`、`createState/createReactiveRunner.ts`、`createEffect.ts`、`createContext.ts`、`render.ts`、`types.ts`。`src/types/htmlPopover.d.ts` 的第三方模块类型扩展、测试及构建配置按各自职责保留 Solid 引用。

JSX 编译器仍会在构建产物中生成 `solid-js/web` 引用；编译器与运行时版本由构建接入管理，源码导入收口不会消除这些生成依赖。

这些入口当前保持既有运行时行为。替换底层时还需要验证初始化、依赖追踪、作用域清理、上下文及渲染行为，目录收口本身不代表已经完成 Solid 2 迁移。
