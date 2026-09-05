# JSS 架构

## 领域身份

`src/jss` 是 UIKit 的 JSS 定义领域。它不定义 Button、Card 或其他组件的业务样式，只提供通用 CSS 内容表达、容器组合、最终解析、激活和 stylesheet 挂载能力。

当前底层实现位于 `src/jss/core`。它保留调用方交付的中间结果，直到真实 stylesheet 输出边界才压平。

源码公开入口是 `src/jss/index.ts`。`package.json` 中原 `./style-utils` 发布子路径还指向已移动的旧目录，因此当前没有可宣称已收口的 JSS 发布子路径。

## 当前核心对象

- `CssKey` 表示 CSS 内容的写入位置。
- `CssValue` 保存原始、动态或嵌套的 CSS 内容结果。普通值可以没有激活动作；需要外部 CSS 定义的 value 可以附着按 `Document` 隔离的一次性激活行为。
- `CssBox` 是当前的组织和生命周期容器。匿名 box、selector box、at-rule box 和 stylesheet box 使用同一内容协议，并保留原始挂载顺序。
- `CssBlock` 是当前可复用快捷结果。其内部内容不对调用方分类，外层由独立 `CssBox` 包裹。
- `cssBlocks` 是当前实现的 block 工厂 registry。它仍与通用 property 工厂和 `focusRing` 混在 core，是待重构现状。

## 当前运行链

```txt
CssKey + CssValue / CssBox / CssBlock
  -> 调用方继续组合，保留原始结果与顺序
    -> stylesheetBox() 形成可连接的根
      -> parseCssStylesheet() 递归解释可达结果
        -> parseCssValue() 压平 value 并执行可达激活
          -> mountCssStylesheet() 按 Document 与身份挂载 <style>
```

创建、import、JS registry 注册或离线组合都不会自行写入 stylesheet。只有结果进入被挂载的 stylesheet 根，它和其中可达的 values 才激活。当前生命周期只保证同一 `Document` 内幂等激活，不做反注册。

## 文件职责

| 文件 | 当前职责 |
| --- | --- |
| `architecture.md` | 当前 JSS 领域、运行链、文件职责与阅读路线。 |
| `index.ts` | JSS 源码公开契约；汇总当前 core 类型与函数。 |
| `core/css-key.ts` | 定义极薄的 `CssKey` 与 key 规范化边界。 |
| `core/css-value.ts` | 定义 `CssValue` 内容协议、动态读取和嵌套序列，不负责最终字符串化。 |
| `core/css-value-activation.ts` | 给已有 `CssValue` 附着激活行为，并记录每个 `Document` 的一次性激活状态。 |
| `core/css-variable.ts` | 用 value 协议表达 `var(...)`；有 `@property` 元数据时，在 value 首次真实解析时按需注册。 |
| `core/css-color.ts` | 用仍可嵌套的 `CssValue` 结果表达 `color-mix(...)`，不提前解析颜色内容。 |
| `core/css-box.ts` | 建立匿名、selector、at-rule 和 stylesheet box，保存头部、内容与挂载顺序。 |
| `core/css-block.ts` | 定义 `CssBlock`、`cssBlocks` registry、注册入口和当前通用 block 工厂。 |
| `core/parse-css-value.ts` | value 的最终解释边界；递归压平结果树、阻止循环引用并执行激活。 |
| `core/parse-css-stylesheet.ts` | stylesheet 的最终解释边界；递归展开 box 与 block，校验结构上下文。 |
| `core/css-stylesheet.ts` | 把 stylesheet 根连接到指定 `Document`，按稳定身份和根复用或更新 `<style>`。 |
| `style-utils.test.ts` | 当前 JSS 黑盒测试；文件名仍保留旧命名，尚未随领域收口。 |

## 定义端与使用端

JSS 的文件边界按工具自身的协议、状态和生命周期划分，不按调用方的视觉段落拆分。

- `cssBlocks.display('none')` 和 `cssBlocks.opacity(0.48)` 是当前由 JSS 定义的通用 block 工厂。
- Button 的 foundation、disabled、tone、size、selector 和状态组合只在 Button 语义下成立，留在 `Button.style.ts`。
- Button 使用 `CssVariable`、`CssValue` 或 `CssBox` 只是对工具的消费，不会产生 `button-values.ts`、`button-blocks.ts` 等工具分类文件。

## 组合边界

- 中间层不得调用 `parseCssValue()` 或 `parseCssStylesheet()` 换取普通字符串；解析只发生在最终输出边界。
- `CssBlock` 调用方不读取内部 box，不根据内部语法分支。
- `CssValue` 可以嵌套其他 values；激活沿最终可达结果树传播，不由 import 或 registry 注册触发。
- `CssVariable` 是当前第一个利用 value 激活的类型，不定义整套生命周期。
- stylesheet 挂载按所属 `Document` 隔离；模块 import 阶段不读取全局 `document`。

## 阅读路线

- 使用当前源码 API：从 `index.ts` 开始。
- 查 block 与容器：读 `core/css-block.ts`、`core/css-box.ts` 和 `core/parse-css-stylesheet.ts`。
- 查 value 与激活：读 `core/css-value.ts`、`core/css-value-activation.ts`、`core/parse-css-value.ts` 和 `core/css-variable.ts`。
- 查 DOM 挂载：读 `core/css-stylesheet.ts`。
- 理解尚未完成的目标 API、atoms、状态变量和 CSS 全量迁移：读 [JSS 样式系统 Plan](../../docs/plans/JSS%E6%A0%B7%E5%BC%8F%E7%B3%BB%E7%BB%9F.md)。
