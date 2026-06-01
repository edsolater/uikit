# hooks 命名约定

## 文件定位

- 本文件只负责约束 `src/hooks` 目录里的 hook / primitive 应该怎么命名。
- 本文件不承载源码注释写法、出口注释写法或目录入口说明。

## 为什么必须显式写领域

- hook 数量少时，人可以靠上下文记住它属于什么领域。
- hook 数量上来以后，单靠 `useXxx` 或 `createXxx` 很容易让人和 AI 都遗忘它到底是浏览器能力、document 能力、element 能力、UI 能力，还是全领域通用基础设施。
- 所以 hook 名字不只要描述“做什么”，还必须描述“在哪个领域做”。

## 命名总规则

- 有领域的 hook / primitive，名字里必须显式带出领域词。
- 无领域不是“未命名”，而是“全领域通用基础设施”。
- 只有当一个能力真的服务全领域、不是浏览器专用、不是 DOM 专用、不是 UI 专用时，才允许不写领域词。
- 仅靠 `use`、`create`、`handle` 这类动词前缀，不算领域信息。
- 如果去掉名字里的某个词之后，读者已经无法判断它属于什么领域，说明这个词不是可选修饰，而是命名必需部分。
- 文件名、主导出名、目录名应尽量一致，避免一个叫法在目录层、文件层、导出层各写一套。

## 无领域的含义

- 无领域 = 全领域通用基础设施。
- 这类能力不应默认依赖浏览器、DOM、document、UI 或某个具体业务主体。
- 这类名字可以直接写能力本体，不额外补领域词。
- 例子：`createState`。
- 如果一个能力其实已经依赖具体宿主或具体对象，就不应继续伪装成无领域基础设施。

## 有领域时怎么写

- 领域词直接写对象域或能力域本身。
- 不要为了命名再额外发明一套“层级词”。
- `Browser`、`Document`、`Element`、`DOM`、`UI` 这些本身就是领域词。
- 领域词优先使用真实对象词、真实宿主词、真实主体词，不要使用模糊大词。

## 领域词选择规则

### Browser

- 当能力绑定浏览器宿主能力时，使用 `Browser`。
- 例子：`useBrowserAnimationFrame`。

### Document

- 当能力绑定 `document` 这个对象时，使用 `Document`。
- 例子：`useDocumentTitle`。

### Element

- 当能力真正依赖的是元素对象本身，例如 `setAttribute`、`removeAttribute` 这类 element 能力时，使用 `Element`。
- 不要用 `Node` 冒充 element 能力，因为 `Node` 太宽。
- 只有明确只服务 HTML 元素时，才考虑 `HTML`；否则优先使用 `Element`。
- 例子：`createElementAttributeMarker`。

### DOM

- `DOM` 适合描述 DOM 树、DOM 挂载、DOM 注册、DOM 节点复用这类“不是单一 document 对象、也不是单一 element 对象”的能力。
- 如果能力其实只绑定某个更具体对象，应优先使用更具体对象词，而不是偷懒写成 `DOM`。
- 例子：`useDOMRegisterer`。

### UI

- 当能力属于界面系统本身，例如主题、焦点管理、弹层编排、界面态协同时，使用 `UI`。
- 例子：`useUIThemeMode`。

### 业务主体

- 如果能力已经属于 table、form、editor、popover、button 等更具体的主体，就直接写主体词，不必退回 `UI`。
- 优先使用最能说明主体边界的领域词。
- 例子：`useTableSelection`、`useFormDraft`、`useEditorHistory`。

## 存量兼容与新增约束

- 当前目录里已经存在一些历史名字，它们没有完全满足这份约定。
- 这些名字可以先作为存量兼容继续存在，但不应继续被当成新命名示范。
- 新增 hook / primitive 必须遵守本文档，不要因为目录里已有旧名就继续复制旧风格。
- 如果后续要统一存量名字，应单独立 plan，按公开 API 破坏面评估后再批量迁移。

## 当前目录里的判断口径

- `createState`：无领域名字，表示全领域通用基础设施，当前可接受。
- `useBrowserAnimationFrame`：带有明确 Browser 领域词，当前符合规则。
- `useDOMRegisterer`：带有明确 DOM 领域词，当前符合规则。
- `createElementAttributeMarker`：带有明确 Element 领域词，当前符合规则。
- `useDocumentTitle`：带有明确 Document 领域词，当前符合规则。
- `useUIThemeMode`：有明确领域词，当前符合规则。

## 修改要求

- 当团队对 hooks 领域划分或命名规则形成新的稳定共识时，应同步更新本文档。
- 当新增 hook 需要依赖本文档之外的例外命名时，应先更新本文档，再落代码。