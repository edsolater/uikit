# Style Utils 架构

## 领域身份

`src/style-utils` 是 UIKit 的 JSS 工具定义领域。它不定义 Button、Card 或其他组件的业务样式，只提供通用的 CSS 内容表达、容器组合、最终解析、激活和 stylesheet 挂载能力。

这个领域保留调用方交付的中间结果，直到真实 stylesheet 输出边界才压平。这样新的 value、box 或 block 能继续嵌入现有结果，不需要让业务层理解 declaration、style rule 或 at-rule 等底层语法分类。

公开入口是 `index.ts`，发布子路径是 `@edsolater/uikit/style-utils`。

## 核心对象

- `CssKey` 表示 CSS 内容的写入位置，不承担 value 语义或生命周期。
- `CssValue` 保存原始、动态或嵌套的 CSS 内容结果。普通值可以没有激活动作；需要外部 CSS 定义的 value 可以附着按 `Document` 隔离的一次性激活行为。
- `CssBox` 是组织和生命周期容器。匿名 box、selector box、at-rule box 和 stylesheet box 使用同一内容协议，并保留原始挂载顺序。
- `CssBlock` 是可复用快捷结果。它的内部内容不对调用方分类，但外层必定有独立 `CssBox`；裸 `CssKey + CssValue` 不是 block。
- `cssBlocks` 是通用 block 工厂的统一 registry。名称表达可复用的 CSS 含义，不表达组件名、来源或语法类别。

## 结果与运行链

```txt
CssKey + CssValue / CssBox / CssBlock
  -> 调用方继续组合，保留原始结果与顺序
    -> stylesheetBox 形成可连接的根
      -> parseCssStylesheet 递归解释可达结果
        -> parseCssValue 压平 value，并执行可达激活
          -> mountCssStylesheet 按 Document 与身份挂载 <style>
```

创建、import、JS 注册或离线组合都不会自行写入 stylesheet。只有某个结果进入被挂载的 stylesheet 根，它和其中可达的 value 才真正激活。当前生命周期只保证同一 `Document` 内幂等激活，不做反注册。

## 文件职责

| 文件 | 当前职责 |
| --- | --- |
| `architecture.md` | 当前领域说明。记录 style-utils 的现役边界、对象关系、运行链、全部文件职责与阅读路线。 |
| `index.ts` | 领域公开契约。只汇总允许调用方使用的类型与函数，不实现新的 CSS 行为。 |
| `css-key.ts` | 定义极薄的 `CssKey` 和 key 规范化边界；不处理 value、box、block 或生命周期。 |
| `css-value.ts` | 定义统一 `CssValue` 内容协议、动态读取和嵌套序列；保留组合结果，不负责最终字符串化。 |
| `css-value-activation.ts` | 给已有 `CssValue` 附着激活行为，并记录每个 `Document` 中的一次性激活状态。 |
| `css-variable.ts` | 用通用 value 协议表达 `var(...)`；存在 `@property` 元数据时，在 value 首次真实解析时按需注册。它是激活机制的一个使用实例，不定义整套生命周期。 |
| `css-color.ts` | 用仍可嵌套的 `CssValue` 结果表达通用 `color-mix(...)` 组合，不提前解析颜色内容。 |
| `css-box.ts` | 建立匿名、selector、at-rule 和 stylesheet box，保存头部、内容和挂载顺序；不输出 CSS 文本。 |
| `css-block.ts` | 定义不透明 `CssBlock`、统一 `cssBlocks` registry、注册入口和现役通用原子工厂；保证每个 block 都由外层 `CssBox` 包裹。 |
| `parse-css-value.ts` | value 的最终解释边界。递归压平 value 结果树、阻止循环引用，并沿可达路径执行激活。 |
| `parse-css-stylesheet.ts` | stylesheet 的最终解释边界。递归展开 box 与 block，校验结构上下文，并把声明交给 value parser。 |
| `css-stylesheet.ts` | 把 stylesheet 根连接到指定 `Document`，按稳定身份和根复用或更新 `<style>`。 |
| `style-utils.test.ts` | 领域黑盒测试。验证离线组合、box 顺序、block 融合、value 延迟读取与激活、解析和挂载幂等；它是测试角色文件，不是生产子领域。 |

## 定义端与使用端

style-utils 的文件边界只按工具自身的协议、状态和生命周期划分，不按调用方的视觉段落拆分。

例如：

- `cssBlocks.display('none')` 和 `cssBlocks.opacity(0.48)` 是脱离 Button 仍然成立的通用原子，由 style-utils 定义。
- Button 的 foundation、disabled、tone、size、selector 和状态组合只在 Button 语义下成立，留在 `Button.style.ts` 使用这些工具。
- Button 使用 `CssVariable`、`CssValue` 或 `CssBox`，只是 Button 对工具的消费关系，不会产生 `button-values.ts`、`button-blocks.ts` 等工具分类文件。

判断一个新 block 是否应注册到 `cssBlocks`，看它离开当前业务主体后是否仍表达同一个可复用 CSS 含义；不能只因为一组声明已经写在一起就注册为通用 block。

## 组合边界

- 中间层不得调用 `parseCssValue()` 或 `parseCssStylesheet()` 换取普通字符串；解析只发生在最终输出边界。
- `CssBlock` 调用方不读取内部 box，也不根据其内部语法分支。内部读取函数只服务最终 parser。
- `CssValue` 可以嵌套其他 values；激活沿最终可达结果树传播，不由 import 或 registry 注册触发。
- `CssVariable` 只是当前第一个利用 value 激活的类型。未来 `CssFunction` 等能力应复用同一机制，而不是把生命周期写死在 variable 分支。
- selector、at-rule 和 stylesheet 是不同头部或根语义的 `CssBox`，不是平行的业务 namespace。
- stylesheet 挂载按所属 `Document` 隔离；不能在模块 import 阶段默认读取全局 `document`。

## 阅读路线

- 想使用现役 API：从 `index.ts` 开始。
- 想增加通用原子 block：阅读 `css-block.ts` 和 `style-utils.test.ts`。
- 想增加新的 value 类型：阅读 `css-value.ts`、`css-value-activation.ts`、`parse-css-value.ts`，再参考 `css-variable.ts`。
- 想增加新的容器形式或解析规则：阅读 `css-box.ts` 与 `parse-css-stylesheet.ts`。
- 想修改真实 DOM 挂载：阅读 `css-stylesheet.ts`。
- 想理解尚未完成的 CSS 全量迁移：阅读 [JSS 样式系统 Plan](../../docs/plans/JSS样式系统.md)。Plan 描述未来工作，不是当前 API 的事实来源。
