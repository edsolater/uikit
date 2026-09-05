# UIKit

SolidJS 基础组件与 hooks 组件库。

这个仓库当前重点不是做大而全的设计系统，而是沉淀一组写组件所需的基础抽象原子、组件写法、样式工具和本地验证方式。`Piv` 是当前最核心的 DOM 原子。

## 先看什么

如果你第一次阅读这个项目，建议按这个顺序看：

- [Architecture.md](Architecture.md)：项目架构入口，先用它理解层次、目录职责、模块边界和调用链。
- [AI Rules README](../ai-rules/README.md)：AI 写法约束入口，先读它来理解规则体系，再按领域进入具体规则文件。
- [src/components/Piv/Piv.tsx](src/components/Piv/Piv.tsx)：当前最核心的 DOM 原子，理解 class、style、htmlProps、on、ref 和 plugins 的消费顺序。
- [src/components/kits/Button/Button.tsx](src/components/kits/Button/Button.tsx)：当前最小组件示例，展示上层组件如何使用 `Piv`。

更细的职责边界写在对应源码文件的文件头注释里。README 只保留项目入口信息，不展开实现细节。

## 项目结构

```txt
src/
  components/    Piv、kits、plugins 与组件共用能力
  hooks/         对外 hooks
  jss/           JSS 定义领域，当前底层实现位于 core/
  css/           当前仍在服役的静态 CSS
  app/           本地 Example 浏览应用
  types/         全局类型补丁
  index.ts       包根发布入口
../ai-rules/     AI 写法约束项目，入口是 ../ai-rules/README.md
```

详细结构说明见 [Architecture.md](Architecture.md)。

`src/app/example-dashboard` 不是正式业务项目，而是用索引和独立详情 URL 浏览组件库验收 Example 的本地应用。

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
