# Piv 与 Dode

Piv 是 UIKit 对外的基础组件入口，管理声明来源、插件和公共能力。
Dode 是本目录内部的元素实现，定义并消费 as、if 与底层 DOM 属性。
两者共同创建一个真实元素，不增加包装 DOM；Button、Card 等组件继续使用 Piv。

## 职责边界

| 内容                                | 负责主体 | 处理方式                                                                     |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------- |
| as、if                              | Dode     | as 在首次实际创建时固定元素类型；if 按属性存在性启用 Show。 |
| plugin、plugins、trait、shadowProps | Piv      | 组织并执行插件，展开声明来源，保留原有执行顺序和合并关系。                   |
| draggable、droppable                | Piv      | 选择有效快捷配置，创建和释放对应插件消费作用域。                             |
| id、class、style、htmlProps         | Dode     | 将组织后的声明交给专用字段消费者，订阅 Source 并维护 DOM。                   |
| on、domRef                             | Dode     | 拥有事件绑定生命周期，完成字段绑定后调用普通 domRef。                           |
| children                            | Dode     | 懒读取子内容 Source，规范化后插入已初始化的元素。                            |

PivProps 组合 Dode 的 DOM 属性契约与管理字段，不重复维护底层属性定义。
Piv 可以合并声明，不承担 class token、CSS 字段、HTML 落点或事件描述符的解析。
Dode 不解释 shadowProps 来源容器、plugin 或快捷能力配置。

## 声明与来源

Piv 在创建前组织直接声明与纯 shadowProps 的 as/if 来源，不读取 class、style、事件或子内容。
无 shadowProps 时复用原声明，不建立额外的结构合并 Proxy 或响应式计算。
直接声明优先；shadowProps 数组后项优先，每份声明先于其嵌套 shadowProps。
as 选择最高优先级的非 undefined 值；if 选择最高优先级存在该属性的来源，保留显式 undefined。

真实元素可用后，Piv 运行 setup，得到插件与直接声明共同形成的 DOM 字段声明。
直接声明保留高优先级位置，plugin 返回值和 shadowProps 作为低优先级来源；各字段继续使用原有合并规则，不统一改成覆盖或拼接。
纯 shadowProps 的 PivShadowProps 契约包含 as/if；DOM 插件返回的 ShadowProps 契约不包含 as/if/children，不能反向控制元素创建或建立反馈重建。

快捷入口只选择配置并注入插件声明，实例执行与释放由插件消费链负责。
有效配置先派生，再映射为插件 Source；配置身份未变时保持插件身份，消费链统一读取 Source。
插件返回的 DOM 声明完整进入来源合并，不在快捷入口只提取 htmlProps/on；具体字段仍沿原生命周期处理，普通 domRef 只读取初始化快照，不因配置切换重跑。

id 的稳定 Source 在合并层形成，持续跟随来源替换和多声明合并。
这属于来源管理，不是 DOM 解析；Dode 将该 Source 直接交给 Effect 自动读取。
class、style、htmlProps 的声明保留惰性读取，具体条件解析、有效字段选择和字段订阅由各自消费者负责。
被覆盖的 HTML/style 字段不继续订阅无效来源。

## as：创建时固定的元素身份

as 可以来自直接 Props 或纯 shadowProps，在首次实际创建元素时确定，默认 div。
之后来源变化不切换标签；if 关闭后重开也沿用首次确定的元素类型，不为 as 建立响应式分支。

## if：按声明启用的条件执行

if 表达“这个元素在什么条件下应当存在”。正常使用时，这个条件应当稳定；特殊情况下允许变化。日常交互中的频繁显示切换不是它的主要用途。

if 接受可解析的 Source，包括 State。输入形式与使用意图分开：传入 State 不代表值一定会变化，技术上支持变化也不代表将动态切换作为推荐用法。

调用方负责条件的语义与使用合理性，Dode 负责解析并执行条件，不检测变化频率或通过初始化快照冻结条件。

只有声明来源中存在 if 属性时才建立 Show，包括显式 if=undefined；未声明时直接创建，不建立条件计算或额外组件作用域。
条件为 false 或 undefined 时不读取元素类型，不解析内部字段、初始化插件或创建子组件。
条件变为 true 时创建并绑定；再次变为 false 时释放该分支；之后变为 true 时重新创建节点和子组件。
该行为沿用普通 Show，不保留脱离实例或增加暂停、恢复机制。

## 创建与清理

无 if 时 Dode 直接创建并绑定元素；存在 if 时使用内部 JSX 组件边界承接分支初始化。
插件或 domRef 的初始化旁读不成为 Show 的结构依赖，不保存、恢复或额外包装 owner。

初始化顺序为：创建裸元素 → Piv setup 组织插件与声明 → Dode 绑定字段和事件 → 调用普通 domRef → 插入 children。
普通 domRef 取得已提交初始字段的真实元素；mount 后可以观察已插入的子节点。

当前 children 懒求值。
整体可替换的 children Source 保持响应式更新。
input、textarea、img、iframe 沿现有模板不插入 children。

字段和监听资源随当前分支释放。
style/HTML 按字段 key 保留作用域，同 key 换来源由原生 Effect 清理后提交新值，字段退出恢复绑定前的 DOM。
事件按原始声明身份保留作用域，其他能力变化不会重置未变化监听的 once 状态，也不会提前触发其 local/global cleanup。

## 公共拖放能力

draggable、droppable 接受 Source<boolean | Options | undefined>，可在同一个元素上启用不同能力。
true 使用原插件默认配置，options 沿原插件配置契约；options.disabled 表示创建后禁用，不等于快捷 false 的零实例路径。

快捷配置选择最高优先级的非 undefined 值，false 覆盖低优先级启用，undefined 继续寻找低优先级快捷声明。
缺省或 false 不创建对应快捷插件实例及其运行状态、DOM 监听或目标注册；显式 false 可以保留配置派生观察，不承诺零全部状态。
动态 Source 具有观察开关所需的控制订阅，关闭时释放插件实例和 DOM 资源，重开仍使用同一个元素。

同一能力选择快捷属性或显式 plugin 一种接入方式。
显式 plugin 沿原声明独立运行，快捷 false 不撤销其资源或接管 usePlugin 创建的 controller。

页内拖动复用现有 Pointer 会话、原元素与 translate，关闭时取消当前拖动并恢复原元素状态。
droppable 关闭时注销内部目标并移除外部事件，外部 DataTransfer 接收、Scope 和占用保护沿现有插件契约。
不启用原生 HTML 拖动，也不在 Dode 复制拖放算法。

## 代码落点

- [Piv.tsx](Piv.tsx)：公开契约组合、声明来源与插件管理入口。
- [Dode.tsx](Dode.tsx)：as/if 与底层 DOM 属性契约、条件执行、创建和绑定。
- [domMap.tsx](domMap.tsx)：受支持 tag 的裸 JSX 工厂。
- [handlePivPlugin.ts](plugin/handlePivPlugin.ts)：插件展开与来源合并。
- [publicCapabilities.ts](plugin/publicCapabilities.ts)：快捷配置选择与插件注入。
- className、handleStyle、handleHTMLProps、on、domRef：各底层声明的专用消费者。

领域测试验证 DOM、事件、Source 换源、分支和卸载行为，不以 owner API 调用次数或文件位置代替行为验收。
