# UIKit

SolidJS 基础组件与 hooks 组件库。

这个仓库当前重点不是做大而全的设计系统，而是沉淀一组写组件所需的基础抽象原子、组件写法和本地验证方式。`Piv` 是当前最核心的 DOM 原子，但 `src/base` 不只等于 `Piv`。

## 先看什么

如果你第一次阅读这个项目，建议按这个顺序看：

- [Architecture.md](Architecture.md)：项目架构入口，先用它理解层次、目录职责、模块边界和调用链。
- [../ai-rules/README.md](../ai-rules/README.md)：AI 写法约束入口，先读它来理解规则体系，再按它引导进入具体规则文件。
- [src/base/pivHelpers/Piv.tsx](src/components/Piv/Piv.tsx)：当前最核心的 DOM 原子，理解 class、style、htmlProps、on、ref 和 plugins 的消费顺序。
- [src/components/Button/Button.tsx](src/components/Button/Button.tsx)：当前最小组件示例，展示上层组件如何使用 `Piv`。

更细的职责边界写在对应源码文件的文件头注释里。README 只保留项目入口信息，不展开实现细节。

## 项目结构

```txt
src/
  base/          写组件用的基础抽象原子
  components/    对外组件
  hooks/         对外 hooks
  App.tsx        本地 demo
  index.ts       发布入口
demo-app/        组件库验收应用集合
../ai-rules/     AI 写法约束项目，入口是 ../ai-rules/README.md
```

详细结构说明见 [Architecture.md](Architecture.md)。

`demo-app` 里的内容不是正式业务项目，而是用来反向验证组件 API、token 和组合边界的小型验收场景。

## 技术栈

- SolidJS
- TypeScript
- Vite
- Storybook
- Bun

## 本地命令

```bash
bun run dev
bun run build
bun run storybook
bun run build-storybook
```

`bun run build` 会同时执行 Vite 构建和类型声明检查，是提交前最基本的验证命令。

## 发布入口

包名是 `@edsolater/uikit`。

对外导出从 [src/index.ts](src/index.ts) 进入，组件和 hooks 分别由 `src/components`、`src/hooks` 汇总导出。
