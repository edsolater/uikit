# Style System 架构

Style System 由模块顶层登记源 Rule，App 在渲染前统一编译并提交 CSS。对象语义见 [design.md](design.md)，命名见 [naming.md](naming.md)，组件写法见 [样式文件写法](../../docs/style/样式文件写法.md)。

# 文件职责

| 位置 | 职责 |
| --- | --- |
| `core/css-condition.ts` | Condition 与有序 Rule 地址。 |
| `subject-conditions.ts` | Subject Condition 名称、已有 Condition 与固定登记顺序；提供内置交互名称。 |
| `core/css-key.ts` | CSS Key 及其内容语法。 |
| `core/css-declaration.ts` | `[key, content]` Declaration。 |
| `core/css-rule.ts` | Rule 登记、批量展开与句柄。 |
| `core/css-value.ts` | RawValue、按 Subject Condition 名称分支的 Value、复合值与按需依赖。 |
| `core/css-variable.ts` | 同名 Variable 引用、根值与注册。 |
| `core/css-root.ts` | 唯一源账本、快照编译与宿主提交。 |
| `compiler/compile-css.ts` | 解析挂载与线性字符串输出两个内部入口。 |
| `compiler/css-records.ts` | 三元组记录的原子挂载与深度优先顺序。 |
| `compiler/compile-value.ts` | 完整 Value 候选、条件贡献、循环检测与复合值降级。 |
| `compiler/compile-declaration.ts` | Declaration 语法与静态简写展开。 |
| `properties` | 浏览器 CSS 属性的 Key。 |
| `selectors/interaction.ts` | 可复用交互 Condition。 |
| `values/functions`、`values` | 复合值、CSS 函数与按需定义。 |
| `values/materials` | 可跨组件使用的设计材料。 |
| `mixins/content.ts` | 内部文字与内容布局。 |
| `mixins/structure.ts` | 主体尺寸与空间边界。 |
| `mixins/appearance.ts` | 主体颜色与视觉层级。 |
| `mixins/interaction.ts` | 点击交互效果。 |

[index.ts](index.ts) 公开组件样式需要的 Rule、Value、Declaration、Condition、Mixin、`cssRoot` 与 `compileCSS`。Root 类、源账本和内部登记入口保持私有；材料与属性从负责文件具名导入。

# 运行链

~~~text
静态导入组件样式
  -> rule() / rules() 登记源 Rule
App 调用 cssRoot.mount()
  -> 快照源账本
  -> resolveRules：解析完整候选与依赖，挂载有序记录数组
  -> stringifyCSS：线性输出 CSS string
  -> 提交到 style#css-root
render()
~~~

`compileCSS()` 只返回同一账本的 CSS string，不写 DOM。`cssRoot.mount()` 保留宿主已有前缀；生成结果未变化时不改节点，编译失败时不提交。详细对象与覆盖语义由 [design.md](design.md) 负责。

记录项严格为 `[(string | undefined)[], string | undefined, string]`，只保存条件、属性与内容。挂载时形成父声明在前、子树连续的顺序，不建立节点对象树，不进行事后排序。两个内部入口不从公共 `index.ts` 导出。

`css-rule.ts` 与 `compile-value.ts` 直接依赖 `subject-conditions.ts`，后者引用 `selectors/interaction.ts` 的已有 Condition，所以 Rule、Value 与 Variable 都能解析预装名称。Rule 地址中的普通部分保持顺序与重复，已安装名称去重并按中央顺序追加；普通 Value 的候选名称也在挂载前去重、按中央顺序转为多层 Condition Path。Variable 的条件只进入自身 Custom Property 赋值，消费表达式保留 `var()`。

# Button 接入

[Button.style.ts](../components/kits/Button/Button.style.ts) 在模块顶层登记全部 Rule，并按默认效果、浏览器交互、variant、tone、size、status 分区。Button 配方留在组件内；共享效果通过 `innerText()`、`contentLayout()`、`size()`、`boundary()`、`color()`、`elevation()` 与 `clickable()` 进入 Style System。

焦点规则由预装的 `focusVisible` 确定生效地址，再用 `boundary({ outline })` 建立边界。danger tone 只覆盖轮廓颜色，不建立焦点专用转发 Mixin。

默认底色保留一次 `colorMix`；中性表面与混合占比都使用 Variable。hover、active 只改变同名变量的值，禁用背景仍由 Button 直接选择。

Button.tsx 静态导入 Button.style.ts。Example、Storybook 和缩略图入口都在渲染前准备 `style#css-root` 并统一挂载；组件渲染不编译样式。懒加载组件仍需由应用样式清单提前导入，`package.json` 的 sideEffects 保留 `.style.ts` 及产物 `.style.js`。

# 验证边界

- 编译器单元测试：登记、覆盖、Subject Condition 名称分支、复合值、循环和按需依赖。
- Root 浏览器测试：CSSOM、宿主前缀、无变化提交与失败保留。
- Condition 浏览器测试：原生交互选择器语义。
- Button 浏览器测试：业务 selector、变量覆盖、交互状态与计算样式。
- 测试登记的 Rule 通过句柄清理。
