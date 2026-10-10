# JSS 内容组织工具公约

`functions` 保存用已有输入组织 JSS 内容的工具，例如 `add`、`multiply`、`colorMix`、`oklch`、`relativeOKLCH` 和 `translateY`。目录名保持 `functions`；“JSS 内容组织工具”说明这里的共同职责。

## 组织自身内容

工具保存输入与依赖，在输出时通过 `resolve` 取得已经编译的子内容，生成自身结果。工具不感知自己被哪个属性、选择器或声明消费，不读取消费位置，不改写 AST，不插入声明，不登记或提供额外资源定义。

子依赖可以是 Variable 或 CSSFunction 等主体。它们的状态和已编译结果可以影响工具输出；主体自己的定义、注册、条件与生命周期仍由主体和编译器负责。工具只使用依赖结果，不反向操作依赖或 AST。

## 返回 Expression 

[content.ts](../../../content.ts) 中的 Expression 是只组织依赖与输出的窄内容契约，要求 `dependencies` 与 `toCSSString`，禁止自身携带 `onActive`、`onCompile`、编译波与资源身份。`createJSSContent` 直接构造这个契约，没有额外身份标签或编译分支。

```ts
const content = createJSSContent(resolve => {
  const source = resolve(amount)
  return source === undefined ? undefined : `calc(${source} + 2px)`
}, [amount])
```

类型限制的是表达式自身可提供的协议，无法证明任意闭包没有副作用。输出方法及其他内容计算仍须遵守上述行为公约，不能绕过类型从外部改写 AST 或状态。

`add`、`multiply` 保存操作数与依赖，输出 CSS calc 文本，数值与单位由浏览器解释。`oklch` 用 ExpressionValue 保存原始通道并输出颜色文本；Value 的 `withContent` 以新数据创建独立包装，沿用输出规则与依赖配置，ExpressionValue 替换内容后仍保留窄契约。这些内容能力不需要知道消费位置或修改 AST。

## 内容工具与修改规则、定义主体的边界

[modification.ts](../../../modification.ts) 的 `Modification<Detail, Type>` 表示通用变化定义，不依赖颜色父类型；通用生命周期按 type 选择源无关转译，Color 参数与实现集中在文件后段。构造用单个配置保存变化的 `name/type/detail`，显式名称是完整 CSS 自定义属性名，内置转译在编译时生成与来源无关的颜色通道配方，并提供独立声明和应用材料。[variable-modify.ts](../../../variable-modify.ts) 通过 FNKit DataShape／`matchShape` 识别双方的自然材料，组织条件修改表达式与步骤；[variable-adjust.ts](../../../variable-adjust.ts) 绑定 Source、Modification 与结果 Variable，使一次结果声明共同声明三者。来源与配方保留 CSS 引用，局部覆盖由浏览器作用域决定。`relativeOKLCH(source, channels)` 只组织来源与通道内容，不解释变化描述或 Variable 身份。

[css-function.ts](../../../css-function.ts) 中的 CSSFunction 与 Variable 同属 Style System 的定义主体。`cssFunction(signature, body)` 创建一个可调用主体，其调用返回 Expression，通过依赖引用主体与实参。按需函数定义属于主体，调用表达式不提供定义。主体的程序身份是对象本身；CSS 名字由签名决定，同名定义的作用域和完整接管由现有编译链处理。

需要消费位置、AST 操作或资源定义的内容对象使用广义 JSSContent，归到负责这些行为的领域；条件应用由外部使用端组织。仅仅返回 JSSContent，不能作为放进 `functions` 的理由。
