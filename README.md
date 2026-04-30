# React Kit

一个轻量的 React 19 基础库骨架，保留三件事：

- 基础组件
- 基础 hooks
- 足够快的本地验证方式

现在已经内置：

- `Button` 基础按钮组件
- `useTitle` 基础 hook
- `src/App.tsx` 本地 demo
- `src/**/*.stories.tsx` Storybook stories

## 目录

```text
src/
  components/
  hooks/
  App.tsx
  index.ts
  main.tsx
```

组件和 hook 通过 `src/index.ts` 统一导出；demo 和 stories 也都直接靠近源码，不额外拆复杂层级。

## Scripts

```bash
bun run dev
bun run build
bun run storybook
bun run build-storybook
```

这个仓库既支持本地开发，也支持作为外部依赖被别的项目安装后直接使用：

```tsx
import { Button } from '@edsolater/react-kit'
```

## Build

- `vite build` 用于打组件库 ES module
- `tsc -p tsconfig.build.json` 只生成类型声明
- `dist/style.css` 是组件样式输出

## Publish

- 包名已经固定为 `@edsolater/react-kit`
- `react` 和 `react-dom` 作为 `peerDependencies` 交给消费方提供，避免业务项目打进两份 React
- 发布前执行一次 `bun run build`
- 发布时使用 `npm publish` 或 `bun publish` 即可

如果后面要继续补组件，按现在的目录直接往 `src/components` 和 `src/hooks` 里加即可，不需要再加额外框架层。
