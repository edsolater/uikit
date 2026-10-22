# Foundation

本目录定义 UIKit 的基础状态、响应式动作、上下文契约，并接入当前 Solid 运行时。使用这些能力的 Hooks、组件和示例从 UIKit 的入口导入，不直接引用 Solid。

- `createState/`：定义 State、StateView、Source、读取与来源转换，以及内部响应式运行机制。
- `createEffect.ts`：响应式动作、挂载和清理入口。
- `render.ts`：内部渲染与 props 接入，保留底层调度、子树复用和惰性读取。
- `types.ts`：当前渲染运行时的类型桥接；仍沿用 Solid 类型，尚未消除类型契约对运行时的依赖。
- `index.ts`：基础状态、Effect、Context 与原生 Loading/Errored 的公开出口；包根公开 render、For、Show 与 JSX 类型供应用挂载和组合渲染，其余底层渲染接入仍留在内部。

Foundation 不依赖 Hooks 或组件。`derive`、`mapSource`、快照与领域派生组合继续由 Hooks 提供。

生产源码中，直接引用 `solid-js` 与 `@solidjs/web` 的实现限定为本目录的 `createState/state.ts`、`createState/state-view.ts`、`createState/promise-like.ts`、`createState/createAsyncSignal.ts`、`createEffect.ts`、`index.ts`、`render.ts`、`types.ts`。`src/types/htmlPopover.d.ts` 的第三方模块类型扩展、测试及构建配置按各自职责保留 Solid 引用。

JSX 编译器仍会在构建产物中生成 `@solidjs/web` 引用；编译器与运行时版本由构建接入管理，源码导入收口不会消除这些生成依赖。

当前接入 Solid 2。State 只有来源 Signal 与结果 Memo 两层：普通值和 Promise 由原生 Signal 保存，函数由原生可写计算跟随依赖；结果 Memo 统一展开 PromiseLike，交给 Solid 等待与传播错误。输入中的 Promise 展开为对外的 `Awaited<T>`，读取与结果层选项使用完成类型。StateView 的 `map` 直接将映射交给 Solid 计算，输出 `Awaited<U>`，后继映射接收完成值；返回 StateView 时跟随其当前来源。写入、派生及 DOM 更新遵循 Solid 的提交时机。组件验收范围为 Button，其余组件与工具的已知差异记录在 [Solid 2 迁移计划](../../docs/plans/2026-10-20-Solid2迁移.md)。

stateView 的普通值转换直接构造只读视图，不建立可写 State；函数来源使用一个原生 Memo 缓存计算与处理异步，函数结果中的函数保持数据。已有 StateView 原样返回，Promise 转换继续按身份复用；可选 map 在统一取得视图后应用。

`createEffect` 优先直接接收单个 Source，多个独立来源使用 tuple，无法自然表达时才使用 compute 函数。计算阶段读取依赖并产出数据，动作阶段的额外读取不增加依赖，动作返回的清理由 Solid 在下次动作前及卸载时执行。内部 DOM 监听同样采用原生两阶段；Piv 的 style 与 HTML 字段由原生 mapArray 按 key 保留作用域，换源时由同一监听清理后提交，字段退出时释放。

内部 `createRenderEffect` 使用相同三入口与优先级，共用一处来源归一化；默认首次动作同步完成，原有第三个原生选项参数继续透传。Piv 合并层复用 derive 输出稳定的 id Source，持续合并插件与直接声明；消费层直接传入该 Source，由 Effect 自动读取，不使用 getter/val 桥接。

`onMount` 对接原生 `onSettled`，动作中的读取不建立依赖，返回的清理由 Solid 管理。响应式计算应在构建阶段登记，不在挂载动作内创建，也不保存和恢复构建阶段的 owner。三种入口登记的清理统一作为动作执行：原生运行时仍拥有清理的时机、顺序和次数，Foundation 只在执行回调时使用原生无 owner 上下文，避免清理旁读订阅触发销毁的计算，并允许公布资源已释放的状态。普通计算中的 State 写入限制不变；DOM ref 在构建阶段同步登记仍使用局部许可，保留 ref 先于 children/mount 的顺序。

Promise 的转换按来源身份缓存，固定 Promise 的计算不归首次消费者所有；原生可写计算只保留读取端，以保存最后完成值及失败。它没有业务响应式上游或外部资源，来源不可达时 WeakMap 与计算图可一同回收。不能把任意派生计算都当作这类固定数据缓存。stateView 的转换选项仅提供 map，不处理等待展示、错误替代或错误通知。

相对更新以来源已有当前值为前提；当前值是 Promise 时，基础层接续更新，业务回调接收完成值。计算来源尚无初值、或 lazy 计算尚未读取时，不承诺保存更新命令；依赖初值的 UI 在 Loading 内读取，完成后再提供相对更新交互。Loading 管理渲染等待，不会替任意命令排队。计算来源的手动写入与重新派生沿用 Solid 原生时序，不另建初始计算、更新队列或 owner 初始化流程。

`Loading` 与 `Errored` 直接使用原生 UI 边界。UI 在读取 State、StateView 或 Promise Source 时由最近的边界处理等待与失败；默认转换不吞错、不以 undefined 伪装已完成。实际异步示例及浏览器回归位于 `createState/AsyncState.example.tsx` 与同名测试。

`val(source, defaultValue)` 先递归读取最终完成值，仅在 null/undefined 时选用默认值；未提供默认值则保留原值，包括 null。函数默认值只在选中时执行，其结果继续按同一读取协议处理。裸 Promise 与 StateView 的等待、失败都原样进入 Solid/UI 边界，val 不建立异步回退计算、捕获错误或切换 owner。

## Context

Foundation 直接导出 Solid 2 的 createContext、useContext 与 Context 类型。Context 自身是 JSX 提供组件，用 `<Context value={value}>` 包围子树；读取最近提供者，离开该子树恢复外层上下文。没有提供者时使用显式默认值，没有可用默认值则抛错；无 owner 的读取同样抛错，不静默返回默认值。KitContextRoot 是无默认值的原生 Context，直接保存节点。宿主 App 每次渲染提供自己的唯一根节点（isRoot: true），根无父级、业务名称或 payload；普通 KitContext 节点在初始化时连接父级。祖先查询遇根结束，未命中返回 undefined，缺少根提供者则由原生抛错。
