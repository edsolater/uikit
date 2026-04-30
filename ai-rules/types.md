# 类型规则

## 用途

这个文件定义 TypeScript 类型应该放在哪里，以及联合类型和 overload 应该如何使用。

它不负责函数抽取、组件 props、CSS、class name 或 Solid 状态模型。

## 类型归属

类型定义跟随归属者。

如果一个 type 明显只服务某个函数、组件、类或 `create*` 能力，就写在这个主体所在文件里。

文件名本身就是 namespace。不要为了“看起来整齐”把紧密相关的小类型拆到别的文件。

推荐：

```ts
export type CreateStateOptions = {
  mode?: StateMode
}

export function createState<T>(initialValue: T, options?: CreateStateOptions) {
  // ...
}
```

不推荐：

```ts
// createState.ts
import type { CreateStateOptions } from './types'

// types.ts
export type CreateStateOptions = {
  mode?: StateMode
}
```

## types.ts 边界

`types.ts` 只在类型没有明确单一文件归属，或者确实被多个平级主体共同消费时使用。

判断归属时要匹配范围。

如果一个类型不属于某个具体文件主体，而是属于整个文件夹领域，可以放在该文件夹的 `types.ts`。

如果类型直接服务某个具体创建函数或主体，就留在该主体文件里。例如 `State`、`SignalState`、`StoreState`、`CreateStateOptions`、`StateMode`、`SignalStateSetter` 这类直接服务 `createState()` 创建语义的类型，应留在 `createState.ts`。

图表多个绘制、hover、tooltip 文件共享同一组点位结构时，可以放在同一业务目录的 `types.ts`。

## import type

允许从父文件或同级文件导入 type。

如果子组件或子能力确实消费父文件定义的公共类型，可以使用 `import type` 直接引用。

不要因为以前后端项目常把类型集中到 `types` 文件，就机械沿用这种结构。TypeScript 已经有 `import type`，类型引用本身不再是拆文件的充分理由。

## 联合类型

同一输入目标优先使用联合类型表达。

如果一个参数语义上就是“要写入的新值”，只是允许直接值或更新函数，就写成：

```ts
type SetValue<T> = T | ((previous: T) => T)
```

不要为了同一目标拆多个 overload。

## Overload

overload 只用于区分不同输入场景会导致不同返回语义的情况。

允许：

```ts
function createState<T>(): [SignalState<T | undefined>, SignalStateSetter<T | undefined>]
function createState<T>(value: T): [SignalState<T>, SignalStateSetter<T>]
function createState<T extends object>(value: T, options: { mode: 'store' }): [StoreState<T>, StoreStateSetter<T>]
```

这里允许 overload，是因为无初始值、默认 signal 和显式 store 的返回类型不同。

不推荐：

```ts
function setValue(value: string): void
function setValue(value: (previous: string) => string): void
```

这里应写成联合类型，因为两个输入都是同一个目标：设置新值。

## 检查清单

- 类型是否跟随明确归属者
- `types.ts` 是否只承载文件夹领域公共类型，而不是某个具体文件主体的附属类型
- 是否允许必要的 `import type`，而不是为避免 type import 制造无归属文件
- 同一输入目标是否使用联合类型
- overload 是否真的对应不同返回语义
