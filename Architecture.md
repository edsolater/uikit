# 文件职责

本文件是 UIKit 当前架构的总入口，说明现役领域、领域边界和真实运行链。领域内部的文件职责由对应领域文档继续展开；未来迁移方案写入 Plan，不用尚未完成的目标替代当前事实。

# 当前系统组成

`src/style-system` 承接 Button、Board 及 Flow 等基础组件的样式登记，尚未迁移的组件继续使用原有静态 CSS；当前文件职责与根挂载边界见 [Style System 架构](src/style-system/architecture.md)。

组件样式文件的配置、命名、注释与组装约定见 [样式文件写法](docs/style/样式文件写法.md)。

Style System 的样式名称、语义主体与 CSS 实现位置见 [Style System 命名](src/style-system/doc/样式系统命名.md)。

- `src/components/Piv`：基础 DOM 原子。对外 Piv 管理元素身份、显示、声明来源及公共拖放能力；内部 Dode 定义和处理 id、class、style、HTML props、事件、domRef 与 children。两者共用一个真实元素，不承载具体 kit 的业务语义；职责与生命周期见 [SPEC.md](src/components/Piv/SPEC.md)。
- `src/components/kits`：对外 UI 组件。组件在各自目录内维护主体、样式、测试与 Example；语义层级区分组织承载能力、独立信息体与常用信息聚合模式，具体契约见 [组件职责与样式归属](docs/guide/组件职责与样式归属.md#零级零点五级一级与二级组件)。Card 与 Board 共享承载实现，以不同名称表达独立信息体和底层承载角色；MessageBoard 使用 Board，公共库不提供 Form。
- `src/components/ComponentMarker`：Piv之上组件的透明边界与用途说明，以及手动FAB控制的结构显示；不改变原主体或自动挂载开关。
- `src/components/plugins`：可挂接到 `Piv` 的交互和结构能力。plugin 定义、plugin 运行机制与各 plugin kit 都属于这一领域。
- `src/components/utils`：多个组件共同使用、但不具有独立组件或 plugin 身份的辅助能力。
- `src/foundation`：基础状态、Effect、Context 契约及 Solid 运行时接入。允许直接引用 Solid 的实现边界见 [Foundation SPEC](src/foundation/SPEC.md)。
- `src/hooks`：使用 Foundation 的派生组合与浏览器协作能力。领域入口和内部阅读路线见 [hooks SPEC](src/hooks/SPEC.md)。
- `src/color-system`：颜色信息与 JS 数值计算。材料先经过层级变换，再应用环境得到最终颜色；不依赖 JSS 或生成 CSS。
- `src/style-system`：Rule、Token 样式定义领域（Token 为现役统一内容模型）。`rules()` 将 Key／Token 声明序列和 Mixin 组合转换为有序 Declaration，CSSRoot 持有源账本，编译器展开声明、状态与依赖，应用统一提交 CSS string；文件职责见 [Style System 架构](src/style-system/architecture.md)。
- `src/css`：仍在服役的静态 CSS 领域。当前继续提供 reset、tokens、controls、traits 与尚未迁移的 CSS 工具；当前结构见 [CSS 架构](src/css/architecture.md)。
- `src/app/example-dashboard`：本地 Example 浏览与浏览器验收入口，不是正式业务应用。
- `src/types`：没有单一源码主体可归属的浏览器与 JSX 全局类型补丁。
- `src/index.ts`：包根发布入口，只汇总现役公开能力和当前基础 CSS 入口。

# 公开入口

- `@edsolater/uikit` 从 `src/index.ts` 公开 components、foundation 和 hooks；`@edsolater/uikit/style-system` 独立公开完整样式 API 与类型。Mixin 直接使用效果名称，样式入口的 `clickable` 与包根组件插件分别导入。包根仍会加载 `src/css/all-base.css`。
- `src/components/index.ts`、`src/foundation/index.ts`、`src/hooks/index.ts` 与 `src/style-system/index.ts` 聚合所属领域的本地模块；具体实现负责公开能力与内部机制的边界。
- Example、测试和 spec 是相邻主体的验证或说明文件，不进入包发布入口。

# 运行链

## 组件渲染

```txt
调用方
  -> kit 组件
    -> ComponentMarker 记录透明边界，保留原主体
      -> Piv 管理声明与 plugins
        -> 内部 Dode 创建并绑定真实元素
          -> Foundation 的运行时接入
            -> SolidJS
              -> DOM
```

kit 负责组件语义，Piv 决定 if/as、来源优先级及能力生命周期，Dode 执行 DOM 绑定。快捷 draggable/droppable 未声明或字面 false 不创建该快捷实例；动态 Source 关闭释放消费作用域，返回声明仍经过同一 DOM 绑定链。手动 plugin 独立沿原声明执行，同一能力选择一种接入方式；快捷 false 不撤销手动 plugin。显式 options.disabled 沿原插件禁用语义创建能力。组件可以使用 hooks、component utils 和 Style System；基础设施不反向依赖具体 kit。

## 组件定位框

kit在定义处以ComponentMarker声明静态身份及可选默认用途，使用处的description覆盖默认值。Marker用Comment界定真实节点范围，在存活集合登记并在卸载时释放，不增加布局元素；Piv及内部实现不登记。用途协议与跨项目接入见[组件定位框](docs/guide/组件结构查看.md)。

App手动放入ComponentMarkerStructureViewTrigger，作为ComponentMarker结构查看模式的激活器。它拥有初始关闭的本地状态；开启才挂载内部Overlay。Overlay逐帧测量真实边界及激活器范围，通过Piv为每个实际矩形创建全尺寸显示宿主：负一级伪元素承载白色半透明和背景模糊，自身名称按父到子顺序绘制，Canvas仅在上层描边。同完整矩形的名称分行，多区域组件仅在首矩形标名；所有名称受所属框宽高约束。遮罩与描边共用本帧激活器范围保留透明洞，关闭即释放显示层与帧循环，不重建原组件或清空状态。激活器与内部覆盖层各自拥有同名.style.ts；Button Example是现有Dev中的消费点，Dashboard导航与App启动方式不变。

共同descriptionDisplay布尔属性由Marker处理显式值与定义默认，普通组件缺省true，Text按外部description实际内容决定默认。仅在Overlay挂载的受管消费中归一显示值，帧循环不直接读取异步Source。false元素根及原生浮层根通过专属模式属性保持opacity为0；裸文字根以透明色Highlight保留原节点，Comment范围同时排除后代定位框。Overlay负责同步与清理，不另建开关、组件树或项目私有隐藏逻辑；普通样式及其Source持续更新，不用旧opacity快照覆盖。

Text与Heading组成文字语义族：Text缺省使用span，互斥的block／p分别选择div／p；Heading以必填level选择h1～h6。两者直接把原生节点交给Piv，纯文字Source持续下传，不通过嵌套彼此制造双重身份。各自的相邻.style.ts通过Style System感知既有Overlay的原生开启状态，仅隐藏文字显示，排版与Source更新保持；关闭或卸载FAB即恢复最新内容。它们不复制开关State，也不缓存或改写DOM文字；Marker及统一Overlay继续负责定位框与标注。两者选择descriptionOnly格式，有说明时只标用途，无说明或空说明时回落各自组件名，其它组件默认格式不变。

## Popover 控制与接入

`src/components/Popover` 拥有通用浮层实体 `PopoverSurface` 与 `createPopoverVisibilityController`。Surface统一原生popover、可选外部锚点、四向定位与完整border-shape轮廓。Geometry通过锚点inset与容器尺寸把目标中心转换为局部坐标，Paint一次绘制圆角主体、箭头、背景、边框和阴影。回退查询翻向，边缘处箭头基点避开圆角并斜指目标；绘制层不撑内容布局，命中沿同一Surface接入阅读交互。无锚点时显示圆角矩形。

按钮组合 `kits/Popover` 复用Button触发动作，拥有标题与正文编排。tooltip插件负责简短辅助信息的悬停／焦点／Escape、延迟关闭与描述关联，不依赖具体kit。两者消费同一Surface及其公开材料Token，tooltip仅在当前浮层的局部类地址选择紧凑暗色材料。Label.tooltip将同一插件挂在末尾问号，tooltipTrigger替换按钮内的显示内容。字符串、数字0、组件与JSX模板持续更新，空值或空字符串不创建提示。

Controller返回 `[controller, controllerBindings]`：前者拥有身份、只读isOpen及显示操作，后者建立并释放触发目标与浮层的DOM连接。isOpen由原生浮层的实际打开状态更新，取消beforetoggle不会被报告为成功打开。

## kit 组件控制与样式

组件 ref 未接入时直接执行原 Button 核心；接入时才走通用 Component Props Director，关系见[组件 Props 与 Controller 状态](docs/guide/组件Props与Controller状态.md)。`components/utils/componentPropsDirector.ts` 按运行时定义为缺省来源在构建时建立字段State，其余字段首次读取时缓存State，工厂与State统一归组件作用域；按state-source-view/state-value-view/state-untracked三种视图输出；only-through-prop字段直接读取上游，不创建State或Controller字段，ref采用此模式。字段描述与类型同归属：Dode提供DOM字段、公共能力提供快捷字段与默认入口、Piv组合自身来源描述、ComponentMarker提供说明描述；Button.prop.ts按继承层次spread组成完整字段表，只定义自身字段及分组/状态默认来源；原核心及Piv/Dode、解析器的运行函数体不变。`components/utils/kit.ts` 用 `kit(definition, core)` 统一定义入口，name 是 Marker 与核心 Context 的共同身份，description 提供默认说明，availableProps 复用完整字段定义。kit 管理 ref 门控、原 Director、登记、换接及唯一透明 Marker；Button 核心只保留分类、状态和 Piv JSX，Button.controllers 提供当前受控实例集合。Context 的 name 与可解构 onCleanup 属于实例能力，清理绑定原 owner；它不参与既有 KitContext 祖先数据，也不要求 App 根。

Text 与 Label 同样通过 kit 创建，分别公开 TextController、LabelController 和各自 .controllers。Text.prop.ts 复用 Piv 与说明定义，移除 as，block/p 保留创建时选择；Text 的 marker getter 保留说明真值控制和 descriptionOnly。Label.prop.ts 只定义关联目标、标题、提示内容与说明字段，不继承 Piv 的额外能力。Label 核心仍拥有 label、问号与 tooltip 组合，提示插件继续管理浮层生命周期。两者的样式仍归原 .style.ts，不提供额外 Token 集合。

公开的 22 个 kits 组件与 PopoverSurface 已统一通过 kit 创建；Piv、Dode、ComponentMarker、StructureViewOverlay 及定位开关属于渲染或控制基础设施，不递归接入。定位开关继续使用 StructureViewControl 跳过自身标注。组件的 .prop.ts 描述原 Props，按继承关系复用拥有者字段；Card 直接复用 Board 的字段表与承载 renderer，两者分别拥有 kit 身份与实例集合。InputValidity 的字段描述与原有效性能力同归属，Input 的旧 CSS 保持原样，本次不迁移样式。

Board、Card、Loop、Table、Article 保留原泛型调用及精确实例 ref。TypeScript 包装丢失的调用关联只在组件定义处作一次类型连接，不增加运行包装。异构实例集合只公开共同安全字段：Board/Card 集合不暴露 Tag 相关节点与插件输入，Loop 集合不暴露 each，Table 集合不暴露 data/keys/renderParts；这些字段通过精确实例 ref 操作；Loop.children 与 Field.children 仅由 Props 提供构建工厂，不属于 Controller。Article 的 ref 归自身，先用现有 mergeProps 固定 article 身份，再由 getter 形式的原生 omitProps 排除自身 ref，直接 createComponent 转交完整字段视图；缺省字段也保留读取通路，承载组件额外字段只透传。foundation/render.ts 以同一函数身份接出 Solid 原生 omit 为 omitProps，只补齐原生已支持的 getter 输入重载，不实现过滤算法。PopoverController 管 Props 字段，PopoverVisibilityController 继续拥有原生浮层操作与生命周期，两者职责不合并。

夹层方案状态见[Button 实例与整体控制入口](docs/plans/261030_Button实例与整体控制入口.md)。纯 shadowProps 的 as／if 结构声明是独立需求，目标与当前阶段限制见 [Piv SPEC](src/components/Piv/SPEC.md#声明与来源)，不属于夹层改造的前置条件。

FNKit 的 [createPathCollector](../fnkit/src/structure-path-collector.ts) 单独负责无限路径收集及读取、调用委托，不保存业务节点数据。[createVirtualBatchAccessor](../fnkit/src/collection-virtual-batch-accessor.ts) 直接接收 Iterable 集合，消费路径并通过 getByPath 读取成员，负责数组接口、所属对象的 this 及固定调用结果。UIKit 从 `@edsolater/fnkit` 公开入口导入，注册器直接传入当前 Controller 的 Set；不维护临时副本或 getter 适配。

批量访问器以函数为 target、Array.prototype 为原型；FNKit 的 isArray 识别它，原生 Array.isArray 仍为 false。数组固有成员与数字索引优先，map 等直接绑定本次映射快照，保留原生参数和返回值，不增加数组结果包装。只有成员路径及成员方法的调用结果继续保持批量访问能力。数组操作不改变注册集合。

```txt
导入 Button.style.ts
  -> 模块顶层 rule() / rules() 登记到 CSSRoot 源账本

App 入口执行 cssRoot.mount()
  -> 快照 CSSRoot 全部源 Rules
    -> 建立 JSSStyleNode 队列，按 JSSContent 的通用能力解析
    -> 生成 JSSContentNode 队列，再输出 CSS string
    -> 收集 onFirstScan 返回的本次派生 Rules
    -> 生成 CSS string
  -> 完整提交到 style#css-root
  -> render() 开始组件渲染
```

Button 静态导入自身样式模块，模块执行时只登记配置。CSSRoot 拥有内部账本、登记句柄和编译提交过程；应用提供 style#css-root，在所有静态样式登记后、render 前统一 mount。组件渲染不触发编译。字符串未变化时不改写节点，编译失败保留之前的成功结果；句柄修改后可以显式再次 mount。Button 的 selector、variant、tone、size 和 status 选择规则留在 Button.style.ts；Button 自身差异在首次使用前定义为 Token；组件选择来源、state 与 address，普通函数组合并返回新 Token。modify 在使用端修改目标，onFirstScan 可提供新的修改，坍缩前完成相关修改读取，不限定激活波数。Token 迁移已实现并通过本轮验证，设计依据见 [Token 设计](src/style-system/doc/Token设计.md)。Mixin 翻译完整效果。完整链路见 [Style System 架构](src/style-system/architecture.md)。

Example 入口静态导入全部 Example，再统一挂载。缩略图 runner 在渲染前建立宿主并挂载。懒加载组件的样式必须由应用样式清单提前导入。package.json 保留 `.style.ts` 与产物 `.style.js` 的副作用，防止静态登记被打包器删除。

## 当前静态 CSS

```txt
src/index.ts
  -> src/css/all-base.css
    -> reset + tokens + controls + traits
```

尚未迁移的组件和 plugins 继续各自 import CSS；`all-base.css` 和这些静态样式仍是现役实现。

## Example 浏览

```txt
src/app/example-dashboard/index.tsx
  -> pages/ExampleDashboard.tsx
    -> /examples 索引
    -> /examples/<id> 对应的相邻 .example.tsx
```

Example Dashboard 只负责发现、导航和展示各主体旁边的 Example，不定义组件自身的业务能力。目录与截图生成共用示例登记；组件按零级、零点五级、一级和二级标识，不能通过依赖计数推算。Board 的承载角色在 MessageBoard 等消费示例中展示，不建立独立信息卡片入口。

# 领域边界

- 碎片的领域发生在定义端。通用 Mixin 不感知 Button；可复用 Pieces 按描述目标和领域归属抽象层，Button 专属定义保留在 Button.style.ts；Token 的创建参数归一为七个固定 key；源码迁移已完成。
- `src/style-system` 提供 Rule 登记、Condition 寻址、声明输入转换、统一 Token 模型、编译和挂载能力，以及可复用 Pieces 和 Theme 配方；具体组件 selector 与业务分类留在组件自己的 style 文件。
- `src/components/Piv`、`src/components/plugins`、`src/hooks` 和 `src/style-system` 都不能反向依赖具体 kit。
- `.example.tsx`、`.test.tsx`、`.browser.test.tsx` 和 `.spec.md` 是角色文件，不因拥有独立文件而成为新领域。
- `src/app/example-dashboard` 不能成为绕过组件库、直接堆叠正式业务视觉的页面层。
- `src/index.ts` 和各目录 `index.ts` 只表达公开契约，不承载 demo、测试或新的业务实现。
- `src/types` 只承载无法就近归属到单一主体的全局补丁。

# 文档边界

- 本文件记录当前可由代码验证的系统关系。
- [组件结构查看](docs/guide/组件结构查看.md)负责用途说明、透明包裹、手动开关与显示边界；具体实施和验收保存在对应Plan及Run。
- [Style System 架构](src/style-system/architecture.md) 和 [CSS 架构](src/css/architecture.md) 记录各自领域的当前文件职责与内部链路。
- [JSS 样式系统历史记录](docs/plans/JSS样式系统.md) 仅保留已经退出的旧方案与验收证据，不作为当前模块、API 或实施计划。
- 通用代码、命名、注释与 CSS 规则从 [AI Rules README](../ai-rules/README.md) 进入，不复制到当前仓库架构中。
