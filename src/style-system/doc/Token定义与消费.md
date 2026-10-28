# Token 的定义与消费

本文使用 [Token 设计](Token设计.md) 的目标接口；源码已完成迁移，示例使用当前源码接口，发布版本需另行发布。

## 从直接值到命名内容

```ts
const spacing = token('2px')
const themeColor = token('red', { name: 'theme-color', address: ':root' })
const feedbackColor = token('red', {
  address: '.Feedback',
  state: { hover: 'pink', active: 'darkred' },
})
```

spacing 没有名称、状态、地址、注册，也没有被 modify，消费时直接输出 2px。themeColor 显式固定在 root，输出命名 CSS 声明及引用。feedbackColor 有状态和地址，自动取得名称，在指定位置输出默认值与状态规则。

Token 对外都是可坍缩的内容，不要求调用者先区分直接值与 CSS variable 身份。最后的输出路径由内部 _kind 决定，_kind 可对外读取，调用方按约定不修改。

## 继承定义与引用内容

```ts
const spacing = token('2px')
const doubledSpacing = token(multiply(spacing, 2))
const sharedSpacing = token(spacing)
```

sharedSpacing 继承直接传入的 spacing 的地址、状态和生命周期等定义配置，默认内容仍引用 spacing；追加配置覆盖同名字段，state 按条件软合并。名称不继承，需要时自动命名，避免同名自引用。

普通计算中的 Token 提供内容引用，消费时取得来源的 CSS 坍缩结果，不在消费端复制状态。生产函数用于延迟计算或消费时读取数据等明确目的。其他加工仍由普通函数组合新 Token，没有内置用途变体或独立定义调整操作。

## State 与组件地址

同一组状态可以独立定义，供多个 Token 使用；state 支持对象、Map、条件 entry 及其嵌套组合，按顺序展开并保留 entry 配对。状态回调收到所属 Token 的基础值，固定状态值直接决定该状态下的结果。

```ts
const feedback = {
  hover: (base) => multiply(base, 2),
  active: 4,
}
const buttonStrength = token(2, {
  name: 'button-strength',
  address: ['@layer uikit', '.Button'],
  state: feedback,
})
```

显式地址固定 default 与 state 的位置；未指定地址时，需要 CSS variable 的定义随实际 AST 消费位置建立，同一 Token 在多处使用就分别发布，不写回 address。真正的全局材料明确指定 root，组件选择来源及自身差异。各层都使用 Token，不增加组件专用创建框架。

CSS 变量身份不改变浏览器原生作用域：显式固定在祖先地址的计算，不会因为后代覆盖某个输入就搬到后代重算。需要当地计算时，使用未指定地址的定义，或明确指定当地 address。

## Modify 改变输出需求

modify 表达使用位置或条件下对同一个目标的修改。原本只是直接值的 Token，只要成为 modify 的目标，就需要 CSS variable 身份；没有名称则自动生成。

坍缩前，编译器必须读完能影响该 Token 的修改，包括 onFirstScan 后续返回的规则。不限定第几波激活，也不能在第一次遇到引用时就提前输出直接值。具体修改与坍缩规则见 [Token 的定义组合与 modify](behaviors/Token的定义组合与modify.md)。

## 声明与提交

Token 的 address 是定义位置，不是附带声明列表。命名声明、条件修改和普通 CSS 属性声明最终都进入样式 AST。输出时需要 CSS variable 的 Token 提供声明及引用，其余 Token 提供 CSS value。

正常编写直接把 Token 放入 rules 的属性内容，由架构自动定义；不手动补 declare。条件变化在自身 state 中表达，独立配置创建新 Token 并明确消费。手动 declare 或 [existingToken, value] 仍允许，但属于调用方承担后果的 dangerous 操作，不做运行时或类型拦截。

规则登记和挂载保持各自职责：组件在自己的 .style.ts 中描述样式，应用统一提交 CSS。直接修改普通 JavaScript 配置不等于已经刷新页面；核心接口已通过本轮单元及浏览器验证；业务组件仅完成编译接入，不据此宣告抽象或视觉设计正确。
