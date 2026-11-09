# Piv 与 Dode

Piv 是 UIKit 对外的基础组件入口，管理声明来源与插件。
Dode 是本目录内部的元素实现，定义并消费 as、if 与底层 DOM 属性。
两者共同创建一个真实元素，不增加包装 DOM；Button、Card 等组件继续使用 Piv。

## 职责边界

| 内容                                | 负责主体 | 处理方式                                                                     |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------- |
| as、if                              | Dode     | as 在首次实际创建时固定元素类型；if 按属性存在性启用 Show。 |
| is、shadowProps | Piv      | 在创建前展开已构建 Plugin 的声明，统一组织来源并交给 Dode。   |
| id、class、style、htmlProps         | Dode     | 将组织后的声明交给专用字段消费者，订阅 Source 并维护 DOM。                   |
| on、domRef                             | Dode     | 拥有事件绑定生命周期，完成字段绑定后按声明身份接入 domRef。                    |
| children                            | Dode     | 懒读取子内容 Source，规范化后插入已初始化的元素。                            |

PivProps 组合 Dode 的 DOM 属性契约与管理字段，不重复维护底层属性定义。
Piv 可以展开声明、组织 Plugin 来源，不承担 class token、CSS 字段、HTML 落点或事件描述符的解析。
Dode 不解释 shadowProps 来源容器或 plugin。

## 声明与来源

Piv 在创建前组织直接声明、纯 shadowProps 与 is 中的已构建 Plugin，形成单一合并 Props 读取视图，
Dode 从中读取 as、if 和 DOM 字段。创建前直接展开 Plugin 的补充声明，不运行业务 core，
因此 `addProps` 提交的 as/if 与 shadowProps 一样参与结构选择。
直接声明优先；shadowProps／is 数组后项优先，每份声明先于其嵌套 shadowProps。
as 选择最高优先级的非 undefined 值；if 选择最高优先级存在该属性的来源，保留显式 undefined。

`ShadowProps` 是唯一的补充声明契约，包含 as、if、domRef、is 及既有其他补充属性；children 仍由直接 Props 提供。
`addProps` 直接提交 shadowProps，不拥有另一套删减后的类型；Plugin 不接收元素。

真实元素可用后，Dode 绑定最终 DOM 字段声明；直接声明保持高优先级位置。
各字段继续使用原有合并规则，不统一改成覆盖或拼接。

能力声明完整进入来源合并；声明变化时接入新 domRef 并释放被移除项。

id 的稳定 Source 在合并层形成，持续跟随来源替换和多声明合并。
这属于来源管理，不是 DOM 解析；Dode 将该 Source 直接交给 Effect 自动读取。
class、style、htmlProps 的声明保留惰性读取，具体条件解析、有效字段选择和字段订阅由各自消费者负责。
被覆盖的 HTML/style 字段不继续订阅无效来源。

## as：创建时固定的元素身份

as 可以来自直接 Props、shadowProps 或 Plugin 声明，在首次实际创建元素时确定，默认 div。
之后来源变化不切换标签；if 关闭后重开也沿用首次确定的元素类型，不为 as 建立响应式分支。

## if：按声明启用的条件执行

if 表达“这个元素在什么条件下应当存在”。正常使用时，这个条件应当稳定；特殊情况下允许变化。日常交互中的频繁显示切换不是它的主要用途。

if 接受可解析的 Source，包括 State。输入形式与使用意图分开：传入 State 不代表值一定会变化，技术上支持变化也不代表将动态切换作为推荐用法。

调用方负责条件的语义与使用合理性，Dode 负责解析并执行条件，不检测变化频率或通过初始化快照冻结条件。

只有声明来源中存在 if 属性时才建立 Show，包括显式 if=undefined；未声明时直接创建，不建立条件计算或额外组件作用域。
条件为 false 或 undefined 时不创建宿主、不读取元素类型、不接入 domRef 或创建子组件；已激活能力的声明仍在结构解析阶段收集，但不会因此创建节点或执行节点接入。
条件变为 true 时创建节点并接入声明；再次变为 false 时释放该分支；之后变为 true 时重新创建节点并重新调用 domRef 回调。
该行为沿用普通 Show，不保留脱离实例或增加暂停、恢复机制。

## 创建与清理

无 if 时 Dode 直接创建并绑定元素；存在 if 时使用内部 JSX 组件边界承接分支初始化。
domRef 的初始化旁读不成为 Show 的结构依赖，不保存、恢复或额外包装 owner。

初始化顺序为：创建裸元素 → 绑定字段和事件 → 调用 domRef → 插入 children。
domRef 取得已提交初始字段的真实元素；mount 后可以观察已插入的子节点。
domRef 在节点接入时调用，并在节点作用域退出时执行回调返回的清理。
`domProxy` 消费者在首次节点就绪后接入资源，按各自所属作用域清理；操作晚于清理的时序缺口见 [Task 与 result Plan](../../../../fnkit/docs/plans/261108_Task与Result执行.md)。

当前 children 懒求值。
整体可替换的 children Source 保持响应式更新。
input、textarea、img、iframe 沿现有模板不插入 children。

字段和监听资源随当前分支释放。
style/HTML 按字段 key 保留作用域，同 key 换来源由原生 Effect 清理后提交新值，字段退出恢复绑定前的 DOM。
事件按原始声明身份保留作用域，其他能力变化不会重置未变化监听的 once 状态，也不会提前触发其 local/global cleanup。

## 拖放能力

在组件内构建 draggable、droppable 或 dragAndDrop，通过 `is` 提交能力。动态 is 移除声明时释放节点资源，再加入时重新接入。

## 代码落点

- [Piv.tsx](Piv.tsx)：公开契约组合、声明来源与插件展开入口。
- [Dode.tsx](Dode.tsx)：as/if 与底层 DOM 属性契约、条件执行、创建和绑定。
- [domMap.tsx](domMap.tsx)：受支持 tag 的裸 JSX 工厂。
- [mergePivProps.ts](plugin/mergePivProps.ts)：创建前插件展开、结构解析与来源合并。
- [domRef.ts](domRef.ts)：按声明身份接入 domRef 并登记清理。
- className、handleStyle、handleHTMLProps、on：各底层声明的专用消费者。

领域测试验证 DOM、事件、Source 换源、分支和卸载行为，不以 owner API 调用次数或文件位置代替行为验收。
