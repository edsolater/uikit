# Style System

此目录使用统一 CssBlock 表达可组合的 CSS 片段，尚未接管组件使用的 `src/jss`。

## 文件职责

- `core/css-block.ts`：保存延迟表达、唯一 slot 和可选依赖，提供 attach、激活传播与最终转换。
- `core/css-block.test.ts`：验证 slot 落点、对象内容、依赖与输出分离及 selector 组合。
- `core/derive/css-selector.ts`：基于 CssBlock 表达 selector，attach 后输出花括号。
- `core/css-variable.ts`：基于 CssBlock 构造变量引用和状态派生；真实变量注册尚未接入。
- `core/css-root.ts`：唯一固定 stylesheet 挂载节点，通过 attach 接通并提交 Block。
- `core/css-root.browser.test.ts`：验证 Token 组合经固定节点产生真实样式。
- `tokens/base-css.ts`：六个基础构造方法，全部接收并返回 CssBlock；margin 将单值组合到四个方向。
- `tokens/base-css.test.ts`：验证基础表达的组合顺序、激活与延迟求值。
- `tokens/css-web-utils.ts`：保留颜色对象与依赖，延迟输出混色表达。
- `tokens/well-known-css-variables.ts`：组合基础颜色变量。
- 仓库 `index.html`：静态提供 `<style id="css-root"></style>`。

core 是核心领域；derive 只是组织延伸构造的分组目录，不建立独立协议或 index 入口。具体组件组合仍属于业务，不进入 core。

## 表达与连接

CssBlock 既可以是纯值，也可以是声明或完整规则，没有强制花括号。content 是第一个参数，可以是字符串、数字、另一个 Block，或接收 slot 的延迟函数。直接传入的 Block 保留引用及激活关系；闭包内的其他引用由 options 中可选的 dependence 显式连接，不做自动追踪。

attach(...blocks) 接受任意数量的对象，按参数顺序接入唯一 slot，同时连接激活关系；多次 attach 按顺序进入同一个 slot，不代表多个独立插槽。slot 不带花括号，也不自动追加到 content 末尾。依赖只负责激活，不自动拼接输出。省略 content 时直接表达 slot。

```ts
const rule = cssSelector('.example')
rule.attach(margin(cssBlock('12px')), boxShadow(cssBlock('none')))
cssRoot.attach(rule)
```

cssSelector 的 content 决定 selector 后的空格、花括号和 slot 位置：没有 attach 时表达为空，attach 后输出括号。底层不检查空内容或修正业务组合。分线器、多独立 slot 和订阅体系均未实现。

## 根与激活

cssRoot 是对象，不接收 stylesheet 参数，自身不激活。attach 时沿依赖激活，再将最终表达写入固定样式节点；不剥离括号，不补结构。共享 Block 只激活一次，已接通 Block 新增连接会立即激活新依赖。

创建和离线连接不转换字符串；转换接口由最终输出调用。相同 Block 在根只提交一次。挂载后的内容更新尚未自动刷新 stylesheet；智能变量的完整注册也尚未接入。
