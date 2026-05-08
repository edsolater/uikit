# File Map

这个文件是项目结构地图，用来帮助维护者快速判断“我该去哪个文件改”。它只记录文件职责和相邻边界，不替代源码里的文件头注释；更细的设计原因应写在具体源码附近。

## 根目录

- `README.md`：项目入口说明，面向第一次打开仓库的人，解释项目是什么、先看哪里、怎么运行。
- `File-Map.md`：文件职责地图，面向维护者和 agent，帮助快速定位修改落点。
- `Agents.md`：agent 修改代码时遵守的规则。
- `package.json`：包信息、依赖和本地命令。
- `vite.config.ts`：组件库构建配置。
- `tsconfig.json`：本地开发与 Storybook 类型检查配置。
- `tsconfig.build.json`：发布类型声明构建配置。

## base

`base` 存放写组件所需的统一基础抽象原子。Piv 是当前最核心的 DOM 原子，但 base 的职责不是只容纳 Piv；后续稳定的组件构建原子也应先落在这里，再被上层 components 使用。

## base/pivHelpers

- `Piv.tsx`：当前最核心的 DOM 原子，负责按 `as` 创建元素，并在 `ref` 阶段按 plugin 合并结果消费 `class`、`style`、`htmlProps`、`on` 和 `ref`。
- `type.ts`：Piv 相关 helper 的基础类型工具，只放跨 piv helper 复用的简单类型。
- `domMap.tsx`：定义 Piv 支持的原生 tag 到 JSX 模板的映射，只负责创建元素、绑定 `richRef` 和插入 `children`。
- `handlePivPlugin.ts`：负责执行 plugin、收集 shadow props，并把 plugin props 与用户 props 按优先级合并。
- `className.ts`：负责把 Piv 的 class 声明绑定到 DOM `classList`，不处理 style、普通 HTML props 或事件。
- `handleStyle.ts`：负责把 Piv 的 style 声明归一、合并并绑定到 DOM inline style，不处理 class 或普通 HTML props。
- `handleHTMLProps.ts`：负责合并并消费普通 HTML props，不处理 class、style、事件、children 或 ref。
- `handleHTMLPropsValue.ts`：负责单个 HTML prop 的 DOM 写入语义，决定 attribute、property、`attr:*` 和 `prop:*` 怎么落到元素上。
- `handleOn.ts`：负责把 Piv 的静态事件声明绑定到 DOM，并在清理时解绑。
- `ref.ts`：负责消费用户传入的 ref，并统一执行 ref 返回的清理函数。

## base/traits

- `index.ts`：基础 trait 出口，汇总可直接传给 Piv `trait` prop 的语义插件。
- `tabular-num.ts`：等宽数字 trait，给动态数字自动补充 `trait:tabular-num` class 并引入对应 CSS。
- `tabular-num.css`：等宽数字 trait 的样式落点，负责 `font-variant-numeric: tabular-nums`。

## base/hooks

元能力，属于组件内部逻辑的“词元”。 按能力层级汇总状态原子和基于状态原子的值类 hook。

- `base-state`：状态原子层，负责创建和读取状态。
  - `createState.ts`：状态创建边界，负责把 Solid 的 signal/store 包装成项目内统一的只读 `State` 和 setter。
  - `read.ts`：状态读取边界，定义 `MayState` 和 `$()` 的最终消费语义。
- `value-state`：值状态层，负责基于 `State` 创建 toggle、ident、count 等常用值状态 hook。
  - `toggle.ts`：boolean标记。
  - `ident.ts`：离散 ident 状态。
  - `count.ts`：整数计数状态。
  - `matcher.ts`：匹配器原子，只围绕现有 accessor 提供 `match`、`notMatch`、`is` 和 `isNot`。
  - `collection.ts`：TODO 集合（Array Object） hook 预留落点。


## components

- `index.ts`：components 目录导出入口，汇总 Button 和必要的基础组件出口。
- `Button.tsx`：基础按钮组件示例，负责按钮主体、默认 type、variant class 和向 Piv 传递 DOM 能力。
- `button.css`：Button 的样式文件。
- `Button.stories.tsx`：Button 的 Storybook 示例。

## hooks

- `index.ts`：hooks 目录导出入口，汇总对外 hook。
- `useTitle.ts`：浏览器标题 hook。
- `useTitle.stories.tsx`：`useTitle` 的 Storybook 示例。

## 本地演示

- `App.tsx`：本地 demo 页面，不参与发布包正式导出。
- `main.tsx`：本地 demo 挂载入口。
- `App.css`：本地 demo 样式。

## 修改入口

- 改 Piv 元能力：先看 `base/pivHelpers/Piv.tsx`，再进入对应 helper 文件。
- 改 class 语义：看 `base/pivHelpers/className.ts`。
- 改 style 语义：看 `base/pivHelpers/handleStyle.ts`。
- 改普通 DOM props 写入：看 `base/pivHelpers/handleHTMLProps.ts` 和 `base/pivHelpers/handleHTMLPropsValue.ts`。
- 改事件模型：看 `base/pivHelpers/handleOn.ts`。
- 改插件解析与优先级：看 `base/pivHelpers/handlePivPlugin.ts`。
- 改状态创建、store/signal 边界或 `State` 类型：看 `base/hooks/lv0-state/createState.ts`。
- 改状态读取、`MayState` 或 `$()` 解包语义：看 `base/hooks/lv0-state/read.ts`。
- 改 toggle、ident、count 这类值状态 hook：先看 `base/hooks/index.ts`，再进入 `base/hooks/lv1-value-signal` 对应文件。
- 新增基于 `State` 的基础 hook：优先放在 `base/hooks`，按状态原子层和语义层判断落到 `lv0-state` 或 `lv1-value-signal`。
- 新增对外组件：放在 `components`，并从组件目录出口汇总。
- 新增对外 hook：放在 `hooks`，并从 hooks 目录出口汇总。
