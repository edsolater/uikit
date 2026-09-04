# 文件职责

本文件是 UIKit 当前架构的总入口，说明现役领域、领域边界和真实运行链。领域内部的文件职责由对应领域文档继续展开；未来迁移方案写入 Plan，不用尚未完成的目标替代当前事实。

# 当前系统组成

- `src/components/Piv`：基础 DOM 原子。负责消费 class、style、HTML props、事件、ref 与 plugins，不承载具体 kit 的业务语义。
- `src/components/kits`：对外 UI 组件。Button、Card、Input、Popover 等组件在各自目录内维护主体、样式、测试、Story 与 Example。
- `src/components/plugins`：可挂接到 `Piv` 的交互和结构能力。plugin 定义、plugin 运行机制与各 plugin kit 都属于这一领域。
- `src/components/utils`：多个组件共同使用、但不具有独立组件或 plugin 身份的辅助能力。
- `src/hooks`：对外响应式状态与浏览器协作能力。领域入口和内部阅读路线见 [hooks README](src/hooks/README.md)。
- `src/style-utils`：JSS 工具定义领域。负责保存可组合的 CSS 结果、在最终边界解析结果，并按 `Document` 挂载 stylesheet；每个文件的职责见 [style-utils 架构](src/style-utils/architecture.md)。
- `src/css`：仍在服役的静态 CSS 领域。当前继续提供 reset、tokens、controls、traits 与尚未迁移的 CSS 工具；当前结构见 [CSS 架构](src/css/architecture.md)。
- `src/app/example-dashboard`：本地 Example 浏览与浏览器验收入口，不是正式业务应用。
- `src/types`：没有单一源码主体可归属的浏览器与 JSX 全局类型补丁。
- `src/index.ts`：包根发布入口，只汇总现役公开能力和当前基础 CSS 入口。

`src/fnkit` 是当前仓库中的历史空目录，不构成现役领域。

# 公开入口

- `@edsolater/uikit` 从 `src/index.ts` 进入，公开 components、hooks 和 style-utils。当前仍会加载 `src/css/all-base.css`。
- `@edsolater/uikit/style-utils` 从 `src/style-utils/index.ts` 进入，只公开 JSS 工具，不经过包根的基础 CSS 副作用。
- `src/components/index.ts`、`src/components/kits/index.ts`、`src/components/plugins/index.ts` 和 `src/hooks/index.ts` 分别收口所属领域的公开成员。
- Example、Story、测试和 spec 是相邻主体的验证或说明文件，不进入包发布入口。

# 运行链

## 组件渲染

```txt
调用方
  -> kit 组件
    -> Piv 与 plugins
      -> SolidJS
        -> DOM
```

kit 负责组件语义，`Piv` 负责把已经形成的 props 与 plugin 结果写入 DOM。组件可以使用 hooks、component utils 和 style-utils；基础设施不反向依赖具体 kit。

## Button 样式

```txt
Button 实际执行
  -> registerButtonStyle()
    -> Button.style.ts 中的业务组合
      -> style-utils 的 CssBox / CssBlock / CssValue 结果
        -> parseCssStylesheet()
          -> mountCssStylesheet()
            -> 当前 Document 的 <style>
```

只 import Button 不会挂载 Button stylesheet。组件函数真实执行时才连接 stylesheet 根；相同 `Document`、稳定身份和根不会重复挂载。Button 的 selector、状态、tone 和 size 组合属于 Button style 领域，style-utils 只定义通用工具。

## 当前静态 CSS

```txt
src/index.ts
  -> src/css/all-base.css
    -> reset + tokens + controls + traits
```

除 Button 外的多数组件和 plugins 目前仍各自 import CSS。只保留 `reset.css` 的状态是迁移目标，不是当前事实；实施规划见 [JSS 样式系统 Plan](docs/plans/JSS样式系统.md)。

## Example 浏览

```txt
src/app/example-dashboard/index.tsx
  -> pages/ExampleDashboard.tsx
    -> /examples 索引
    -> /examples/<id> 对应的相邻 .example.tsx
```

Example Dashboard 只负责发现、导航和展示各主体旁边的 Example，不定义组件自身的业务能力。

# 领域边界

- 工具的领域发生在工具定义端。Button 使用 `cssBlocks` 不会让通用 block 变成 style-utils 内的 Button 子领域，也不会授权 style-utils 注册 `buttonFoundation`、`buttonDisabled` 一类业务组合。
- `src/style-utils` 只提供通用 CSS 表达、组合、解析和挂载能力；具体组件 selector、状态和视觉组合留在组件自己的 style 文件。
- `src/components/Piv`、`src/components/plugins`、`src/hooks` 和 `src/style-utils` 都不能反向依赖具体 kit。
- `.example.tsx`、`.stories.tsx`、`.test.tsx`、`.browser.test.tsx` 和 `.spec.md` 是角色文件，不因拥有独立文件而成为新领域。
- `src/app/example-dashboard` 不能成为绕过组件库、直接堆叠正式业务视觉的页面层。
- `src/index.ts` 和各目录 `index.ts` 只表达公开契约，不承载 demo、测试或新的业务实现。
- `src/types` 只承载无法就近归属到单一主体的全局补丁。

# 文档边界

- 本文件记录当前可由代码验证的系统关系。
- [style-utils 架构](src/style-utils/architecture.md) 和 [CSS 架构](src/css/architecture.md) 记录各自领域的当前文件职责与内部链路。
- [JSS 样式系统 Plan](docs/plans/JSS样式系统.md) 记录尚未完成的迁移目标、顺序、验收和未决问题。
- 通用代码、命名、注释与 CSS 规则从 [AI Rules README](../ai-rules/README.md) 进入，不复制到当前仓库架构中。
