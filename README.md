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
npm run dev
npm run build
npm run storybook
npm run build-storybook
```

## Build

- `vite build` 用于打组件库 ES module
- `tsc -p tsconfig.lib.json` 只生成类型声明
- `dist/style.css` 是组件样式输出

如果后面要继续补组件，按现在的目录直接往 `src/components` 和 `src/hooks` 里加即可，不需要再加额外框架层。
