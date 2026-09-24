# 文件职责

本文件是 UIKit 当前架构的总入口，说明现役领域、领域边界和真实运行链。领域内部的文件职责由对应领域文档继续展开；未来迁移方案写入 Plan，不用尚未完成的目标替代当前事实。

# 当前系统组成

`src/style-system` 已接管 Button 样式，其余组件目前仍使用各自的静态 CSS；当前文件职责与根挂载边界见 [Style System 架构](src/style-system/architecture.md)。

组件样式文件的配置、命名、注释与组装约定见 [样式文件写法](docs/style/样式文件写法.md)。

Style System 的样式名称、语义主体与 CSS 实现位置见 [Style System 命名](src/style-system/doc/naming.md)。

- `src/components/Piv`：基础 DOM 原子。负责消费 class、style、HTML props、事件、ref 与 plugins，不承载具体 kit 的业务语义。
- `src/components/kits`：对外 UI 组件。Button、Card、Input、Popover 等组件在各自目录内维护主体、样式、测试、Story 与 Example。
- `src/components/plugins`：可挂接到 `Piv` 的交互和结构能力。plugin 定义、plugin 运行机制与各 plugin kit 都属于这一领域。
- `src/components/utils`：多个组件共同使用、但不具有独立组件或 plugin 身份的辅助能力。
- `src/hooks`：对外响应式状态与浏览器协作能力。领域入口和内部阅读路线见 [hooks README](src/hooks/README.md)。
- `src/style-system`：Rule、Value 与 Variable 样式定义领域。`rules()` 将 Key／Variable 声明序列和 Mixin 组合转换为有序 Declaration，CSSRoot 持有源账本，编译器展开声明、状态与依赖，应用统一提交 CSS string；文件职责见 [Style System 架构](src/style-system/architecture.md)。
- `src/css`：仍在服役的静态 CSS 领域。当前继续提供 reset、tokens、controls、traits 与尚未迁移的 CSS 工具；当前结构见 [CSS 架构](src/css/architecture.md)。
- `src/app/example-dashboard`：本地 Example 浏览与浏览器验收入口，不是正式业务应用。
- `src/types`：没有单一源码主体可归属的浏览器与 JSX 全局类型补丁。
- `src/index.ts`：包根发布入口，只汇总现役公开能力和当前基础 CSS 入口。

# 公开入口

- `@edsolater/uikit` 从 `src/index.ts` 进入，公开 components、hooks，以及 Style System 的 `cssRoot` 和 `compileCSS` 启动入口。当前仍会加载 `src/css/all-base.css`。
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

kit 负责组件语义，`Piv` 负责把已经形成的 props 与 plugin 结果写入 DOM。组件可以使用 hooks、component utils 和 Style System；基础设施不反向依赖具体 kit。

## Button 样式

```txt
导入 Button.style.ts
  -> 模块顶层 rule() / rules() 登记到 CSSRoot 源账本

App 入口执行 cssRoot.mount()
  -> 快照 CSSRoot 全部源 Rules
    -> 解析三项 Rule、Value、Variable 与延迟 CSS Function
    -> 收集 onActive 返回的本次派生 Rules
    -> 生成 CSS string
  -> 完整提交到 style#css-root
  -> render() 开始组件渲染
```

Button 静态导入自身样式模块，模块执行时只登记配置。CSSRoot 拥有内部账本、登记句柄和编译提交过程；应用提供 style#css-root，在所有静态样式登记后、render 前统一 mount。组件渲染不触发编译。字符串未变化时不改写节点，编译失败保留之前的成功结果；句柄修改后可以显式再次 mount。Button 的 selector、variant、tone、size 和 status 选择规则留在 Button.style.ts；Button 自身差异在首次使用前定义为 Variable，通用材料拥有共享状态，Mixin 翻译完整效果。完整链路见 [Style System 架构](src/style-system/architecture.md)。

Example 入口静态导入全部 Example，再统一挂载。Storybook preview 提前导入 Button 样式后挂载；缩略图 runner 在渲染前建立宿主并挂载。懒加载组件的样式必须由应用样式清单提前导入。package.json 保留 `.style.ts` 与产物 `.style.js` 的副作用，防止静态登记被打包器删除。

## 当前静态 CSS

```txt
src/index.ts
  -> src/css/all-base.css
    -> reset + tokens + controls + traits
```

除 Button 外的多数组件和 plugins 目前仍各自 import CSS；`all-base.css` 和对应静态样式仍是现役实现。

## Example 浏览

```txt
src/app/example-dashboard/index.tsx
  -> pages/ExampleDashboard.tsx
    -> /examples 索引
    -> /examples/<id> 对应的相邻 .example.tsx
```

Example Dashboard 只负责发现、导航和展示各主体旁边的 Example，不定义组件自身的业务能力。

# 领域边界

- 工具的领域发生在工具定义端。通用 Mixin 不感知 Button；通用材料按描述目标和领域归属抽象层，Button 专属定义保留在 Button.style.ts；Variable 定义后作为黑盒使用。
- `src/style-system` 提供 Rule 登记、Condition 寻址、声明输入转换、Value、Variable、编译和挂载能力，以及可复用材料和 Theme 配方；具体组件 selector 与业务分类留在组件自己的 style 文件。
- `src/components/Piv`、`src/components/plugins`、`src/hooks` 和 `src/style-system` 都不能反向依赖具体 kit。
- `.example.tsx`、`.stories.tsx`、`.test.tsx`、`.browser.test.tsx` 和 `.spec.md` 是角色文件，不因拥有独立文件而成为新领域。
- `src/app/example-dashboard` 不能成为绕过组件库、直接堆叠正式业务视觉的页面层。
- `src/index.ts` 和各目录 `index.ts` 只表达公开契约，不承载 demo、测试或新的业务实现。
- `src/types` 只承载无法就近归属到单一主体的全局补丁。

# 文档边界

- 本文件记录当前可由代码验证的系统关系。
- [Style System 架构](src/style-system/architecture.md) 和 [CSS 架构](src/css/architecture.md) 记录各自领域的当前文件职责与内部链路。
- [JSS 样式系统历史记录](docs/plans/JSS样式系统.md) 仅保留已经退出的旧方案与验收证据，不作为当前模块、API 或实施计划。
- 通用代码、命名、注释与 CSS 规则从 [AI Rules README](../ai-rules/README.md) 进入，不复制到当前仓库架构中。
