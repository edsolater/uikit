# 文件职责

本文件是 UIKit 当前架构的总入口，说明现役领域、领域边界和真实运行链。领域内部的文件职责由对应领域文档继续展开；未来迁移方案写入 Plan，不用尚未完成的目标替代当前事实。

# 当前系统组成

`src/style-system` 接管组件样式及其材料，组件改造参照 Button；`reset.css` 只重置浏览器默认行为，`APP.css` 只定义作用于 App 全局或根节点的样式。组件内样式必须通过自身 `.style.ts` 接入 Style System，不能因首屏加载而改用组件 CSS；具体边界见[样式文件写法](docs/style/样式文件写法.md)。当前运行链见 [Style System 架构](src/style-system/architecture.md)。

组件样式文件的配置、命名、注释与组装约定见 [样式文件写法](docs/style/样式文件写法.md)。

Style System 的样式名称、语义主体与 CSS 实现位置见 [Style System 命名](src/style-system/doc/样式系统命名.md)。

- `src/components/Piv`：基础 DOM 原子。对外 Piv 管理元素身份、显示、声明来源及公共拖放能力；内部 Dode 定义和处理 id、class、style、HTML props、事件、domRef 与 children。两者共用一个真实元素，不承载具体 kit 的业务语义；职责与生命周期见 [SPEC.md](src/components/Piv/SPEC.md)。
- `src/components/kits`：可供组合的界面构件，包括基础承载与完整用途组件。Popover 与 Tooltip 的浮层能力归 plugins，旧 `kits/Popover` 的 Surface／显隐生产设施已退出；物理残留清理状态见[本轮实施详情](agents/运行方案/261106_Popover与Tooltip能力重构_实施详情.md#旧设施退出与清理受阻)。组件在各自目录内维护主体、样式、测试与 Example；语义层级区分组织承载能力、独立信息体与常用信息聚合模式，具体契约见 [组件职责与样式归属](docs/guide/组件职责与样式归属.md#零级零点五级一级与二级组件)。Card 与 Board 共享承载实现，以不同名称表达独立信息体和底层承载角色；MessageBoard 使用 Board，公共库不提供 Form。
- `src/components/plugins`：可挂接到 `Piv` 的交互和结构能力。`plugins/tools` 负责 Plugin 定义入口；每次在组件内调用 inactivePlugin 只构建一次，返回 `{ plugin, controller }`，单元的 `plugin` 在创建前提交已准备声明，`controller` 直接使用；组合工具统一返回角色能力结果集合 `plugins` 与对应的 `controller` 集合，各端能力通过 `plugins.role` 交给节点。拖放组合能力、draggable、droppable 及其示例归 `plugins/kits/dragAndDrop`；成对浮层能力 `createPopoverPlugins` 归 `plugins/kits/Popover`，只处理显隐、关联、状态和功能定位。
- `src/components/tools`：服务构件定义、控制与检查的工具，包括 `kit` 创建入口、Props 干预、Controller 登记与 `ComponentIdentityMarker`。`tools/ComponentIdentityMarker` 为 Kit 构件及使用方组合提供透明边界、用途说明和手动结构查看，不改变原主体或自动挂载开关。
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
    -> ComponentIdentityMarker 记录透明边界，保留原主体
      -> Piv 管理声明与 plugins
        -> 内部 Dode 创建并绑定真实元素
          -> Foundation 的运行时接入
            -> SolidJS
              -> DOM
```

kit 负责组件语义，Piv 在创建前展开直接声明、shadowProps 与 is 中已构建 Plugin 的声明，按来源优先级形成单一 Props 读取视图；Dode 读取该视图并执行 DOM 绑定。能力 core 在组件内配置调用时运行一次，返回完整 Controller 并收集声明；`is` 直接展开 Plugin 中的声明，节点接入与清理由 `domRef`／`withDom` 承担。拖放能力在组件内构建并通过 `is` 使用；动态移除声明时释放对应节点资源。显式 options.disabled 沿原插件禁用语义创建能力。组件可以使用 hooks、构件工具 和 Style System；渲染基础设施与插件运行机制不依赖具体用途组件；tooltip 等具体插件可消费共享浮层。

## 组件定位框

kit在定义处以ComponentIdentityMarker声明静态身份与componentDescription职责说明，使用处通过PivProps.label表达实例业务名称。Marker只选一份标注：非空label优先，否则使用componentDescription；两者均空时默认不画自身框，不用组件名补位，也不阻止有说明的子组件。显示回退不改写实例label，Piv仍只将label转换为真实根元素的低优先级aria-label。label沿声明来源合并，支持整体及列表项Source，非空文字以空格连接。未声明字段不建立对应DOM消费链；动态来源加入或移除字段时，共同字段入口建立或释放其作用域。Source当前值为undefined仍是已声明字段。Controller显式写入未传入字段时才将其加入声明形状，普通读取不启用能力。Marker用Comment界定真实节点范围，在存活集合登记并在卸载时释放，不增加布局元素；Piv及内部实现不登记。用途协议与跨项目接入见[组件定位框](docs/guide/组件结构查看.md)。

App手动放入ComponentIdentityMarkerStructureViewTrigger，作为ComponentIdentityMarker结构查看模式的激活器。它拥有初始关闭的本地状态；开启才挂载内部Overlay。Overlay逐帧测量真实边界及激活器范围，通过Piv为每个实际矩形创建全尺寸显示宿主：负一级伪元素承载白色半透明和背景模糊，自身名称按父到子顺序绘制，Canvas仅在上层描边。同完整矩形的名称分行，多区域组件仅在首矩形标名；所有名称受所属框宽高约束。遮罩与描边共用本帧激活器范围保留透明洞，关闭即释放显示层与帧循环，不重建原组件或清空状态。激活器与内部覆盖层各自拥有同名.style.ts；Button Example是现有Dev中的消费点，Dashboard导航与App启动方式不变。

共同descriptionDisplay由Marker处理，显式值优先：false隐藏自身与后代范围；true允许显示自身范围，即使没有文字也不编造标注；未指定时仅有有效标注的范围显示，无说明返回undefined而不隐藏后代。Kit不再提供标注格式或默认显示配置。仅在Overlay挂载的受管消费中读取Source，帧循环不直接读取异步Source。false元素根及原生浮层根通过专属模式属性保持opacity为0；裸文字根以透明色Highlight保留原节点，Comment范围同时排除后代定位框。Overlay负责同步与清理，不另建开关、组件树或项目私有隐藏逻辑；普通样式及其Source持续更新，不用旧opacity快照覆盖。

Text与Heading组成文字语义族：Text缺省使用span，互斥的block／p分别选择div／p，仍承载纯文字Source；Heading以必填level选择h1～h4，保留Piv的组合内容与动态来源能力。两者直接把原生节点交给Piv，不通过嵌套彼此实现。Heading自身观察最终DOM文本并同步为id，作为结构与导航定位节点，不自动变成Link；观察器随原生节点退出释放。各自的相邻.style.ts通过Style System感知既有Overlay的原生开启状态，仅隐藏文字显示，排版与Source更新保持；关闭或卸载FAB即恢复最新内容。它们不复制开关State，也不缓存或改写DOM文字；Marker及统一Overlay继续负责定位框与标注。两者沿用共同标注规则；没有组件职责与有效实例名称时自然不画自身框，无需专用选项。

## Popover 控制与接入

`src/components/plugins/kits/Popover` 提供组合能力 `createPopoverPlugins`。组合工具统一汇集 `{ plugins, controller }`；Popover 直接声明 trigger／body core，并通过工具第二参数的 controller 回调补充本领域快捷引用。`plugins` 的 trigger／body 是原始能力结果，分别交给实际 Button／Card 等宿主，`controller` 提供两端完整 Controller 与常用显隐方法的直接引用。内部身份关联本组两端，打开状态以原生 toggle 为事实来源；默认打开、原生事件和焦点操作属于这项功能，不通过旧 Popover 组件 ref 或 `Controller.props` 接入。

`popover.style.ts` 只提供锚定、定位、翻向、间距和锚点可见性等功能规则；实际 Card 或业务 `.style.ts` 负责内容布局和绘制。Plugin 不生成背板、箭头或内容容器，也没有额外 ComponentIdentityMarker；组件结构查看展示实际 Button／Card 的身份与边界。

`tooltip({ content, $anchorPosition, $anchorGap })` 是一元自身能力，内部一次构建 `createPopoverPlugins` 和单个 Piv 正文；触发端以 `triggerAction:false` 保留锚定但关闭按钮关联及 dialog／expanded 语义，正文以 `autoFocus:false` 避免提示夺取焦点。Popover 统一原生显隐、状态和功能定位，Tooltip 自己负责描述关联、阅读交互及同一正文的暗色材料。旧 Surface、VisibilityController、Geometry／Paint 及其目录内的生产设施不再参与运行链。

tooltip 插件继续负责简短辅助信息的悬停／焦点／Escape、延迟关闭与描述关联。`kits/Help` 声明即呈现独立帮助入口，通过自己的 tooltip 属性使用同一插件；Label 判断 tooltip 非空时才在标题末尾组合 Help，tooltipTrigger 传给 Help.trigger 替换问号内的显示内容。字符串、数字0、组件与JSX模板持续更新，空值或空字符串关闭并移除附属浮层、清理计时，再次有内容时接回同一正文，不重建能力或换源代理。

## kit 组件控制与样式

### 声明与组件创建

公开 Kit 组件先声明 Props、字段协议与 Controller，再以 `KitComponent<{ props: Props; controller: Controller }>` 约束实现。`KitProps<{ $styleConfig: Config; controller: Controller; domTag: Tag }>` 聚合 Piv、结构查看显示选择、样式输入与组件 ref；固定语义根按职责收窄或移除字段。`KitPropDefinition<OwnDefinition>` 只接收自有模式，内部覆盖同名公共模式；公开 `kitPropDefinition` 完整组合 Dode/Piv、ComponentIdentityMarker 与 Kit 自有规则，私有 `kitCommonPropDefinition` 只拥有 ref/$styleConfig。

KitProps、KitComponent、KitController、KitOptions 与 ControllerRegistry 以具名配置表达所整合的信息，各字段职责在使用处直接可见。KitProps 的三个字段及整份配置可省略；样式配置默认为无具体字段，controller 默认为通用输入控制形状，domTag 默认为 div。业务 Table 的 Row/ColumnKey、元素变换工具及插件配置仍沿自身契约表达，见[信息整合类泛型的设计准则](docs/guide/信息整合类泛型的设计准则.md)。

每个组件的 `.prop.ts` 聚合 Props、字段协议类型和值、Controller 声明及候选事实，相关定义保持紧邻。`.style.ts` 聚合 StyleConfig 类型、箭头解释函数、Token 与规则；`.tsx` 负责装配、渲染和实际业务能力。`components/tools/kit.ts` 中 KitOptions 与 kit 属于同一组件定义与创建板块。PropsOf、ControllerOf、旧 Inputs、自动输入补全及 directorOptions 已退出，不保留旧签名适配。

`kit(options, render)` 固定身份、定义职责 `componentDescription`、完整字段表及可选样式解释。已声明的 KitComponent 为核心 props 和 Context 提供上下文，核心参数不再标注类型。name 与 Marker 共用组件身份，exposeController 接收已声明业务成员，onCleanup 绑定当前实例 owner；这些能力不依赖祖先 KitContext 或 App 根。

### 输入控制与实例生命周期

创建时没有组件 ref，核心直接消费输入；只有初始 ref 才启用 Component Props Director 并进入 `.controllers`。Director 按完整字段协议交付 Source、跟踪当前值、不跟踪当前值或原样透传四种视图。可干预字段共用一份 State，工厂与 State 归实例作用域，不用 Effect 复制值。替换 ref 交付同一个 Controller，移除 ref 不改变受控模式，卸载才退出集合。完整契约见[组件 Props 与 Controller 状态](docs/guide/组件Props与Controller状态.md)。

业务核心提供自身能力后，kit 组合通用 `.props`、登记并交付 Controller；没有业务成员时无需公开空对象。Button 状态解析器直接连接输入来源，Input 有效性能力沿原规则产生最终 invalid 状态。Button、Board、Card 通过 variantGroups 复用候选声明，由 kit 统一连接缺省分组与候选省略。

Board、Card、Loop、Table 保留泛型调用与精确实例 ref；异构 `.controllers.props` 只提供共同安全字段，原生 Tag 相关输入、列表 each、表格行列和单元格配置留给精确 ref。Loop.children 与 Field.children 是只由 Props 提供的构建工厂。Card 复用 Board 的字段与承载渲染行为，两者各有 Marker 和实例集合；Article 固定 article 语义根，与 Card 组合时保留各自实例，见[组件嵌套](docs/guide/组件嵌套.md)。

### 根声明、样式与组件身份

kit 的透明 ComponentIdentityMarker 建立身份与用途边界，`Piv/elementDeclarations.ts` 承接同根组合的实例样式与原生属性声明。组件把公共节点输入沿 shadowProps 交给真实根；Piv/Dode 消费后在子内容边界终止传递，不额外增加容器 DOM。Piv、Dode、ComponentIdentityMarker、StructureViewOverlay 与定位开关属于基础设施，不递归接入 kit。

StyleConfig 独立声明配置值域，解释函数仅接受该契约校验。KitComponent 的公开调用类型复用该契约中的 `$direction` 等同名样式属性；Table 的泛型入口复用相同类型规则，组件内部 Props、字段协议与 Controller 不新增别名字段。

kit 在输入控制前调用独立的 `components/tools/parseStyleConfigProps.ts`，所有组件统一使用 `$styleConfig`，Parser 按同名美元字段聚合，不再去掉前缀；显式 `$styleConfig` 的同名字段优先，包括值为 undefined 的字段。

配置与解释字段统一使用美元前缀，通常直接写组件属性。Button 使用 `$gap`，Flow 使用 `$direction`、`$gap`、`$width`、`$grow`，Grid 使用 `$columns` 等布局字段，Table 使用 `$compact`、`$columnWidths`、`$columnMinWidths`。整组来源或显式覆盖时使用 `$styleConfig`，其中字段与直接属性同名。Parser 排除容器自身；Kit 与绑定层固定使用唯一入口，不保留字段名参数或双协议分支。

没有直接样式字段需要聚合时，Parser 直接返回原 props；需要聚合时才建立惰性视图并消费直接字段，普通属性保持原身份。

整体与字段 Source 在消费时读取，Controller 通过单一 `props.$styleConfig` State 干预最终配置，写入清空不会再补回入口别名。

kit 同步调用原有解释函数，Token.set 收集当前实例的 CSS 标量覆盖，Piv 应用与清理；共享 Token 默认值保持不变。无配置时直接采用默认效果，无配置字段的组件不创建空解释对象。Flow 的方向与排列差异、Grid 的列结构均归 `.style.ts`，原生 style 由 Piv 保留为不推荐的底层逃生舱。

Text 的纯文字及标签选择、Heading 的标题层级与定位 ID、Label 的字段关联和 Help 组合由各自组件维护。组件样式归同名 `.style.ts`，父组件不接管子组件外观。Popover 等 Plugin 通过能力结果的 controller 使用，实际 Button/Card 继续拥有组件 Controller、Marker 与样式。

拖放在真实 DOM 绑定时创建同步 Pointer 会话和接收目标登记，指针默认行为、捕获及材料交付保持在原事件事务内；节点绑定退出时取消或注销。Top Layer 同样通过 domRef 接入节点，挂载后提升并随绑定退出恢复，不通过异步操作代理延后真实事件。

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
    -> /examples/<id> 对应的使用场景（组件场景位于自身 examples/）
```

Example Dashboard 只负责发现、导航和展示各主体旁边的 Example，不定义组件自身的业务能力。目录与截图生成共用示例登记；组件按零级、零点五级、一级和二级标识，不能通过依赖计数推算。Board 的承载角色在 MessageBoard 等消费示例中展示，不建立独立信息卡片入口。

# 领域边界

- 碎片的领域发生在定义端。通用 Mixin 不感知 Button；可复用 Pieces 按描述目标和领域归属抽象层，Button 专属定义保留在 Button.style.ts；Token 的创建参数归一为七个固定 key；源码迁移已完成。
- `src/style-system` 提供 Rule 登记、Condition 寻址、声明输入转换、统一 Token 模型、编译和挂载能力，以及可复用 Pieces 和 Theme 配方；具体组件 selector 与业务分类留在组件自己的 style 文件。
- `src/components/Piv`、插件运行机制、`src/hooks` 和 `src/style-system` 不反向依赖具体用途 kit。tooltip 等具体插件复用 `plugins/kits/Popover` 的成对功能能力；附属正文通过 Piv 创建，提示材料在 tooltip.style.ts，不反向依赖用途 kit 或旧 Surface。
- 组件 `examples/` 内的场景、`.test.tsx`、`.browser.test.tsx` 和 `.spec.md` 是角色文件，不因拥有独立文件而成为新领域。非组件领域的示例仍沿用各自现有组织。
- `src/app/example-dashboard` 不能成为绕过组件库、直接堆叠正式业务视觉的页面层。
- `src/index.ts` 和各目录 `index.ts` 只表达公开契约，不承载 demo、测试或新的业务实现。
- `src/types` 只承载无法就近归属到单一主体的全局补丁。

# Markdown 解析与呈现

Markdown 自行解析常用 Markdown 语法，块结构与行内语法分别由 `parser.ts`、`inline-parser.ts` 负责，通过内部内容树交给 `renderer.tsx`；公开 `renderers` 接收已渲染的 `content`。默认节点由 Piv 创建，一级至四级标题复用 Heading，链接复用 Link；现有 Table 的对象记录协议不参与 Markdown 表格。支持标题、段落、代码、引用、嵌套列表、任务列表、表格、强调、删除线及链接图片，支持范围不等同完整 GFM。原生 HTML 显示为文本，未知标记及未闭合的行内语法保留文字；未闭合围栏按代码读取到文档结尾。实体只解码数字实体及 amp、lt、gt、quot、apos、nbsp 六种常用名称，代码保持原样。块缩进以空格识别，代码内的制表符原样保留。地址只保留阅读所需的相对路径与协议。

# 文档边界

- 本文件记录当前可由代码验证的系统关系。
- [组件结构查看](docs/guide/组件结构查看.md)负责用途说明、透明包裹、手动开关与显示边界；具体实施和验收保存在对应Plan及Run。
- [Style System 架构](src/style-system/architecture.md) 和 [CSS 架构](docs/style/CSS架构.md) 记录各自领域的当前文件职责与内部链路。
- [JSS 样式系统历史记录](docs/plans/JSS样式系统.md) 仅保留已经退出的旧方案与验收证据，不作为当前模块、API 或实施计划。
- 通用代码、命名、注释与 CSS 规则从 [AI Rules README](../ai-rules/README.md) 进入，不复制到当前仓库架构中。
