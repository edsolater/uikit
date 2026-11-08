# 文件职责

本文件是 UIKit 当前架构的总入口，说明现役领域、领域边界和真实运行链。领域内部的文件职责由对应领域文档继续展开；未来迁移方案写入 Plan，不用尚未完成的目标替代当前事实。

# 当前系统组成

`src/style-system` 接管组件样式及其材料，组件改造参照 Button；`reset.css` 只重置浏览器默认行为，`APP.css` 只定义作用于 App 全局或根节点的样式。组件内样式必须通过自身 `.style.ts` 接入 Style System，不能因首屏加载而改用组件 CSS；具体边界见[样式文件写法](docs/style/样式文件写法.md)。当前运行链见 [Style System 架构](src/style-system/architecture.md)。

组件样式文件的配置、命名、注释与组装约定见 [样式文件写法](docs/style/样式文件写法.md)。

Style System 的样式名称、语义主体与 CSS 实现位置见 [Style System 命名](src/style-system/doc/样式系统命名.md)。

- `src/components/Piv`：基础 DOM 原子。对外 Piv 管理元素身份、显示、声明来源及公共拖放能力；内部 Dode 定义和处理 id、class、style、HTML props、事件、domRef 与 children。两者共用一个真实元素，不承载具体 kit 的业务语义；职责与生命周期见 [SPEC.md](src/components/Piv/SPEC.md)。
- `src/components/kits`：可供组合的界面构件，包括基础承载与完整用途组件。`kits/Popover` 当前只保留旧 Tooltip 仍需的 Surface、显隐工具和材料，不再提供 Popover 内容组件。组件在各自目录内维护主体、样式、测试与 Example；语义层级区分组织承载能力、独立信息体与常用信息聚合模式，具体契约见 [组件职责与样式归属](docs/guide/组件职责与样式归属.md#零级零点五级一级与二级组件)。Card 与 Board 共享承载实现，以不同名称表达独立信息体和底层承载角色；MessageBoard 使用 Board，公共库不提供 Form。
- `src/components/plugins`：可挂接到 `Piv` 的交互和结构能力。`plugins/tools` 负责 Plugin 定义入口；每次在组件内调用 inactivePlugin 只构建一次，返回 `{ plugin, controller }`，单元的 `plugin` 在创建前提交已准备声明，`controller` 直接使用；组合工具统一返回角色能力结果集合 `plugins` 与对应的 `controller` 集合，各端能力通过 `plugins.role` 交给节点。拖放组合能力、draggable、droppable 及其示例归 `plugins/kits/dragAndDrop`；成对浮层能力 `createPopoverPlugins` 归 `plugins/kits/Popover`，只处理显隐、关联、状态和功能定位。
- `src/components/tools`：服务构件定义、控制与检查的工具，包括 `kit` 创建入口、Props 干预、Controller 登记与 `KitMarker`。`tools/KitMarker` 为 Kit 构件及使用方组合提供透明边界、用途说明和手动结构查看，不改变原主体或自动挂载开关。
- `src/foundation`：基础状态、Effect、Context 契约及 Solid 运行时接入。允许直接引用 Solid 的实现边界见 [Foundation SPEC](src/foundation/SPEC.md)。
- `src/hooks`：使用 Foundation 的派生组合与浏览器协作能力。领域入口和内部阅读路线见 [hooks SPEC](src/hooks/SPEC.md)。
- `src/color-system`：颜色信息与 JS 数值计算。材料先经过层级变换，再应用环境得到最终颜色；不依赖 JSS 或生成 CSS。
- `src/style-system`：Rule、Token 样式定义领域（Token 为现役统一内容模型）。`rules()` 将 Key／Token 声明序列和 Mixin 组合转换为有序 Declaration，CSSRoot 持有源账本，编译器展开声明、状态与依赖，应用统一提交 CSS string；文件职责见 [Style System 架构](src/style-system/architecture.md)。
- `src/css`：浏览器默认行为重置及 CSS 入口；原生控件、文档视觉策略与功能类由 Style System 登记，当前结构见 [CSS 架构](docs/style/CSS架构.md)。
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
    -> KitMarker 记录透明边界，保留原主体
      -> Piv 管理声明与 plugins
        -> 内部 Dode 创建并绑定真实元素
          -> Foundation 的运行时接入
            -> SolidJS
              -> DOM
```

kit 负责组件语义，Piv 在创建前展开直接声明、shadowProps 与 is 中已构建 Plugin 的声明，按来源优先级形成单一 Props 读取视图；Dode 读取该视图并执行 DOM 绑定。能力 core 在组件内配置调用时运行一次，返回完整 Controller 并收集声明；`is` 直接展开 Plugin 中的声明，节点接入与清理由 `domRef`／`withDom` 承担。拖放能力在组件内构建并通过 `is` 使用；动态移除声明时释放对应节点资源。显式 options.disabled 沿原插件禁用语义创建能力。组件可以使用 hooks、构件工具 和 Style System；渲染基础设施与插件运行机制不依赖具体用途组件；tooltip 等具体插件可消费共享浮层。

## 组件定位框

kit在定义处以KitMarker声明静态身份及可选默认用途，使用处的description覆盖默认值。Marker用Comment界定真实节点范围，在存活集合登记并在卸载时释放，不增加布局元素；Piv及内部实现不登记。用途协议与跨项目接入见[组件定位框](docs/guide/组件结构查看.md)。

App手动放入KitMarkerStructureViewTrigger，作为KitMarker结构查看模式的激活器。它拥有初始关闭的本地状态；开启才挂载内部Overlay。Overlay逐帧测量真实边界及激活器范围，通过Piv为每个实际矩形创建全尺寸显示宿主：负一级伪元素承载白色半透明和背景模糊，自身名称按父到子顺序绘制，Canvas仅在上层描边。同完整矩形的名称分行，多区域组件仅在首矩形标名；所有名称受所属框宽高约束。遮罩与描边共用本帧激活器范围保留透明洞，关闭即释放显示层与帧循环，不重建原组件或清空状态。激活器与内部覆盖层各自拥有同名.style.ts；Button Example是现有Dev中的消费点，Dashboard导航与App启动方式不变。

共同descriptionDisplay布尔属性由Marker处理显式值与定义默认，普通组件缺省true，Text按外部description实际内容决定默认。仅在Overlay挂载的受管消费中归一显示值，帧循环不直接读取异步Source。false元素根及原生浮层根通过专属模式属性保持opacity为0；裸文字根以透明色Highlight保留原节点，Comment范围同时排除后代定位框。Overlay负责同步与清理，不另建开关、组件树或项目私有隐藏逻辑；普通样式及其Source持续更新，不用旧opacity快照覆盖。

Text与Heading组成文字语义族：Text缺省使用span，互斥的block／p分别选择div／p，仍承载纯文字Source；Heading以必填level选择h1～h4，保留Piv的组合内容与动态来源能力。两者直接把原生节点交给Piv，不通过嵌套彼此实现。Heading自身观察最终DOM文本并同步为id，作为结构与导航定位节点，不自动变成Link；观察器随原生节点退出释放。各自的相邻.style.ts通过Style System感知既有Overlay的原生开启状态，仅隐藏文字显示，排版与Source更新保持；关闭或卸载FAB即恢复最新内容。它们不复制开关State，也不缓存或改写DOM文字；Marker及统一Overlay继续负责定位框与标注。两者选择descriptionOnly格式，有说明时只标用途，无说明或空说明时回落各自组件名，其它组件默认格式不变。

## Popover 控制与接入

`src/components/plugins/kits/Popover` 提供组合能力 `createPopoverPlugins`。组合工具统一汇集 `{ plugins, controller }`；Popover 直接声明 trigger／body core，并通过工具第二参数的 controller 回调补充本领域快捷引用。`plugins` 的 trigger／body 是原始能力结果，分别交给实际 Button／Card 等宿主，`controller` 提供两端完整 Controller 与常用显隐方法的直接引用。内部身份关联本组两端，打开状态以原生 toggle 为事实来源；默认打开、原生事件和焦点操作属于这项功能，不通过旧 Popover 组件 ref 或 `Controller.props` 接入。

`popover.style.ts` 只提供锚定、定位、翻向、间距和锚点可见性等功能规则；实际 Card 或业务 `.style.ts` 负责内容布局和绘制。Plugin 不生成背板、箭头或内容容器，也没有额外 KitMarker；组件结构查看展示实际 Button／Card 的身份与边界。

旧 Tooltip 尚未迁移，仍使用 `kits/Popover/PopoverSurface`、其材料样式和 `createPopoverVisibilityController`。该旧显隐工具返回 `[controller, controllerBindings]`，分别提供状态／操作和 DOM 接入；这不是新 `createPopoverPlugins` 的返回结构。旧 Surface 仍包含 Geometry／Paint，它们的暂留用于现有 Tooltip，不表示新 Plugin 接管这些绘制职责。

tooltip 插件继续负责简短辅助信息的悬停／焦点／Escape、延迟关闭与描述关联。`kits/Help` 声明即呈现独立帮助入口，通过自己的 tooltip 属性使用同一插件；Label 判断 tooltip 非空时才在标题末尾组合 Help，tooltipTrigger 传给 Help.trigger 替换问号内的显示内容。字符串、数字0、组件与JSX模板持续更新，空值或空字符串不创建浮层。

## kit 组件控制与样式

组件 ref 未接入时直接执行原 Button 核心；接入时才走通用 Component Props Director，关系见[组件 Props 与 Controller 状态](docs/guide/组件Props与Controller状态.md)。`components/tools/componentPropsDirector.ts` 按运行时定义为缺省来源在构建时建立字段State，其余字段首次读取时缓存State，工厂与State统一归组件作用域；按state-source-view/state-value-view/state-untracked三种视图输出；only-through-prop字段直接读取上游，不创建State或Controller字段，ref采用此模式。字段描述与类型同归属：Dode提供DOM字段、Piv组合自身来源描述、KitMarker提供说明描述；Button.prop.ts按继承层次spread组成完整字段表，只定义自身字段及分组默认来源；状态解析器通过 `createState(() => props[statusName])` 在创建时连接来源，不用 Effect 复制状态。`components/tools/kit.ts` 用 `kit(definition, core)` 统一定义入口，name 是 Marker 与核心 Context 的共同身份，description 提供默认说明，availableProps 复用完整字段定义。kit 管理 ref 门控、原 Director、登记、换接及唯一透明 Marker；Button 核心只保留分类、状态和 Piv JSX，Button.controllers 提供当前受控实例集合。所有组件 Controller 的 `.props` 统一提供输入干预；Context 的 `exposeController` 接入组件自己的顶层能力，没有自定义能力时无需公开空对象。Context 的 name 与可解构 onCleanup 属于实例能力，清理绑定原 owner；它不参与既有 KitContext 祖先数据，也不要求 App 根。

Text、Label 与 Help 通过 kit 创建，分别公开自身 Controller 和 .controllers。Text.prop.ts 复用 Piv 与说明定义，移除 as，block/p 保留创建时选择；Text 的 marker getter 保留说明真值控制和 descriptionOnly。Label.prop.ts 只定义关联目标、标题、提示内容与说明字段，不继承 Piv 的额外能力。Label 核心拥有字段标题与 Help 组合，Help 拥有问号及其样式，提示插件继续管理浮层生命周期。各组件的样式归同名 .style.ts，不提供额外 Token 集合。

公开的 kits 组件与 PopoverSurface 已统一通过 kit 创建；Piv、Dode、KitMarker、StructureViewOverlay 及定位开关属于渲染或控制基础设施，不递归接入。定位开关继续使用 StructureViewControl 跳过自身标注。组件的 .prop.ts 描述原 Props，按继承关系复用拥有者字段；Card 直接复用 Board 的字段表与承载 renderer，两者分别拥有 kit 身份与实例集合。InputValidity 的字段描述与原有效性能力同归属，Input 样式由自身 Style System 定义承接。

Board、Card、Loop、Table 保留泛型调用及精确实例 ref；Article 固定原生 article，保留自身精确实例 ref。TypeScript 包装丢失的调用关联只在组件定义处作一次类型连接，不增加运行包装。异构实例的 `.controllers.props` 集合只公开共同安全字段：Board/Card 集合不暴露 Tag 相关节点与插件输入，Loop 集合不暴露 each，Table 集合不暴露 data/keys/renderParts；这些字段通过精确实例 ref 操作；Loop.children 与 Field.children 仅由 Props 提供构建工厂，不属于 Controller。Article 属于[语义组件](docs/guide/语义组件.md)，仅提供独立正文身份与首尾块外边距裁剪，不提供容器皮肤、as 或 Carrier 透传。核心直接使用固定 as 的 Piv，字段表移除继承的 as。普通阅读卡片用 `<Card><Article>正文</Article></Card>` 表达视觉容器承载独立正文；正文内的资料卡片也可反向组合，含义判断见[组件嵌套](docs/guide/组件嵌套.md)。两个节点各自拥有 Marker、样式和实例引用；Card 不提供 is 内容模式。Popover 从返回对象的 `controller` 取得 `PopoverController`，其 trigger／body 分别提供 `PopoverTriggerController`／`PopoverBodyController`，不属于 kit 组件的 `.props` 输入干预协议。Input 顶层公开最终 invalid 状态，输入干预继续经过原有效性规则。

夹层方案状态见[Button 实例与整体控制入口](docs/plans/261030_Button实例与整体控制入口.md)。统一 ShadowProps 与创建前 Plugin 展开已由 [is 声明解析与 Plugin 调用协议统一](docs/plans/261105_is声明解析与Plugin调用协议统一.md) 落实，Piv 的结构声明与字段声明使用同一套补充声明契约。

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
    -> reset
```

组件和插件样式通过 Style System 登记；原生控件与文档视觉策略由组件聚合入口登记。`APP.css` 只用于作用于 App 全局或根节点的样式。

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
- `src/components/Piv`、插件运行机制、`src/hooks` 和 `src/style-system` 不反向依赖具体用途 kit。tooltip 等具体插件可消费 `kits/Popover` 的共享 Surface、显隐 Controller 与公开 Token，不依赖组合 Button 的 `Popover`。
- `.example.tsx`、`.test.tsx`、`.browser.test.tsx` 和 `.spec.md` 是角色文件，不因拥有独立文件而成为新领域。
- `src/app/example-dashboard` 不能成为绕过组件库、直接堆叠正式业务视觉的页面层。
- `src/index.ts` 和各目录 `index.ts` 只表达公开契约，不承载 demo、测试或新的业务实现。
- `src/types` 只承载无法就近归属到单一主体的全局补丁。

# 文档边界

- 本文件记录当前可由代码验证的系统关系。
- [组件结构查看](docs/guide/组件结构查看.md)负责用途说明、透明包裹、手动开关与显示边界；具体实施和验收保存在对应Plan及Run。
- [Style System 架构](src/style-system/architecture.md) 和 [CSS 架构](docs/style/CSS架构.md) 记录各自领域的当前文件职责与内部链路。
- [JSS 样式系统历史记录](docs/plans/JSS样式系统.md) 仅保留已经退出的旧方案与验收证据，不作为当前模块、API 或实施计划。
- 通用代码、命名、注释与 CSS 规则从 [AI Rules README](../ai-rules/README.md) 进入，不复制到当前仓库架构中。
