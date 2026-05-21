# Architecture

## Purpose

- 这个文件是当前仓库的结构与边界入口。
- 它负责帮助维护者和 AI 快速理解“这个项目分成哪些层、每层负责什么、应该去哪里改”。
- 它不替代源码文件头注释。
- 它不承载通用代码规范、CSS 规范、命名规范或注释规范。

## Capability Model

- 当前仓库是 SolidJS UIKit 项目。
- 当前仓库的目标是沉淀基础 DOM 原子、基础组件、基础 hook 和本地验证方式。
- 当前仓库不是大而全的设计系统。
- 当前仓库优先提供稳定、直接、边界清楚的基础能力。
- 当前仓库默认只考虑最新浏览器和现代 CSS 能力。

## Layering

- `src/base`：基础抽象原子层。
  - 负责底层 DOM、状态原子、局部组件能力和 trait。
  - 这一层提供可复用能力，不直接承载业务级组件语义。
- `src/components`：对外组件层。
  - 负责基础组件主体与组件级本地 demo / story。
  - 这一层向调用方暴露稳定组件入口。
- `src/hooks`：对外 hook 层。
  - 负责浏览器协作类或通用调用方能力。
  - 这一层向调用方暴露稳定 hook 入口。
- `src/App.tsx`：本地 demo 装配层。
  - 只负责把各主体旁边的 `.demo.tsx` 组合成首页。
  - 不应把具体 demo 实现长期堆在 `App.tsx` 里。
- `src/index.ts`：发布入口层。
  - 负责统一对外导出。
  - 不承载 demo、story 或本地验证逻辑。

## Runtime Flow

- 本地开发入口从 `src/main.tsx` 进入。
- `src/main.tsx` 只负责挂载 `src/App.tsx`。
- `src/App.tsx` 只负责组合各主体就近定义的 demo。
- 组件和 hook 的正式发布入口始终从 `src/index.ts` 收口。
- `src/components/index.ts` 和 `src/hooks/index.ts` 负责各自目录的对外汇总导出。

## File Map

- 根目录
  - `Agents.md`：agent 入口与仓库级协作约束。
  - `Architecture.md`：项目架构、模块边界、目录职责与调用链路。
  - `README.md`：项目入口说明。
  - `package.json`：包信息、依赖和本地命令。
  - `src`
    - `App.css`：本地 demo 样式。
    - `App.tsx`：本地 demo 页面装配入口。
    - `base`
      - `BasicComponent`
        - `className.ts`：把 class 声明绑定到 DOM `classList`。
        - `domMap.tsx`：原生 tag 到 JSX 模板的映射。
        - `handleHTMLProps.ts`：合并并消费普通 HTML props。
        - `handleHTMLPropsValue.ts`：单个 HTML prop 的 DOM 写入语义。
        - `handleOn.ts`：静态事件绑定与清理。
        - `handlePivPlugin.ts`：plugin 执行、shadow props 收集与合并。
        - `handleStyle.ts`：style 归一、合并与 DOM 绑定。
        - `index.ts`：`BasicComponent` 目录导出入口。
        - `Piv.tsx`：基础 DOM 组件原子。
        - `ref.ts`：ref 消费与清理。
        - `type.ts`：`BasicComponent` 相关基础类型工具。
      - `component`
        - `index.ts`：`component` 目录导出入口。
        - `kitContext.tsx`：组件树内局部 context 链能力。
        - `Loop.tsx`：响应式循环组件。
      - `hooks`
        - `base-state`
          - `createState.ts`：状态创建边界，统一 signal/store 封装。
          - `index.ts`：`base-state` 目录导出入口。
          - `read.ts`：状态读取语义，定义 `Source` 和 `val()`。
        - `domRef.ts`：DOM ref 状态原子与 ref 写入口。
        - `index.ts`：`base/hooks` 目录导出入口。
        - `value-state`
          - `collection.ts`：集合状态相关 hook 预留落点。
          - `count.ts`：整数计数状态。
          - `ident.ts`：离散 ident 状态。
          - `matcher.ts`：基于 accessor 的匹配器原子。
          - `toggle.ts`：boolean 标记状态。
      - `traits`
        - `index.ts`：`traits` 目录导出入口。
        - `tabular-num.css`：等宽数字 trait 样式。
        - `tabular-num.ts`：等宽数字 trait。
    - `components`
      - `Button`
        - `Button.demo.tsx`：Button 的本地 HTML demo。
        - `index.ts`：`Button` 目录导出入口。
        - `Button.stories.tsx`：Button 的 Storybook 示例。
        - `Button.tsx`：基础按钮组件。
        - `button.css`：Button 样式。
      - `Popover`
        - `hooks`
          - `createPopoverController.ts`：Popover 本地控制能力，管理原生 popover 生命周期与打开状态镜像。
        - `Popover.demo.tsx`：Popover 的本地 HTML demo。
        - `index.ts`：`Popover` 目录导出入口。
        - `Popover.stories.tsx`：Popover 的 Storybook 示例。
        - `Popover.tsx`：基础 Popover 组件，封装触发器、原生 popover 容器与 anchor positioning 结构。
        - `popover.css`：Popover 样式，包含原生定位与 border-shape 箭头样式。
      - `index.ts`：`components` 目录导出入口。
    - `css`
      - `architecture.md`：CSS 结构说明。
      - `controls.css`：内建控件样式。
      - `color.css`：颜色变量与颜色相关样式。
      - `dimension.css`：尺寸变量与尺寸相关样式。
      - `how-to-use.md`：CSS 使用说明。
      - `reset.css`：基础重置样式。
      - `todo.md`：CSS 待办记录。
    - `hooks`
      - `index.ts`：对外 hooks 目录导出入口。
      - `useTitle`
        - `index.ts`：`useTitle` 目录导出入口。
        - `useTitle.demo.tsx`：`useTitle` 的本地 HTML demo。
        - `useTitle.stories.tsx`：`useTitle` 的 Storybook 示例。
        - `useTitle.ts`：浏览器标题 hook。
    - `index.css`：全局样式入口。
    - `index.ts`：包发布入口。
    - `main.tsx`：本地 demo 挂载入口。
    - `types`
      - `htmlPopover.d.ts`：Popover API 与相关 HTML 属性的 JSX 类型补丁。
      - `htmlElementViewTransition.d.ts`：`HTMLElement.startViewTransition()` 的全局类型补丁。
  - `tsconfig.build.json`：发布类型声明构建配置。
  - `tsconfig.json`：本地开发与 Storybook 类型检查配置。
  - `vite.config.ts`：组件库构建配置。

## Module Boundaries

- `src/base` 不应反向依赖 `src/components` 或 `src/hooks` 的业务主体。
- `src/components` 的 demo、story 和局部能力应尽量就近放在组件目录内。
- `src/hooks` 的 demo、story 和主体实现应尽量就近放在 hook 目录内。
- `src/App.tsx` 只装配 demo，不定义 demo 主体。
- `src/index.ts` 只处理对外导出，不夹带本地验证代码。
- `types` 目录只承载没有明确单一主体归属的全局类型补丁。

## Do Not Do

- 不要把组件 demo 长期堆在 `App.tsx`。
- 不要把 story、demo 和正式发布入口混成同一职责文件。
- 不要把 `src/base` 当成业务级组件目录使用。
- 不要把结构文档退化成单纯的目录清单，而忽略层次和边界。

## Agent Notes

- AI 先读 `Agents.md`，再读本文件理解当前仓库结构。
- 需要判断“文件该落在哪一层、应该改谁、不该跨哪条边界”时，优先参考本文件。
- 发现本文件缺少结构信息时，应补结构、边界和调用链，而不是只补文件名索引。