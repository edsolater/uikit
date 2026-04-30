# Solid 状态

## 用途

这个文件定义 Solid 业务代码里的动态状态写法。

它只约束业务层如何创建、读取、传递和修改状态，不约束 `State` 底层实现文件内部如何调用 Solid 原生 API。

## 核心规则

业务代码统一使用 `createState()` 创建动态状态。

`createState()` 返回 `[state, setState]`：

- `state` 是只读状态。
- `setState` 是唯一写入口。
- 读取状态必须使用 `$()`。
- `StoreState` 的字段访问返回子 `State`。

禁止业务代码直接使用 `createSignal` 或 `createStore`。只有 `State` 底层实现文件可以直接使用这些 Solid 原生状态 API。

## 状态类型

状态分为三层类型：

- `SignalState`：内部使用 `createSignal`，适合基础值、数组、DOM ref 和明确要整体替换的对象。
- `StoreState`：内部使用 `createStore`，自身也是主状态，可以整体读取；对象字段访问会返回子 `State`。
- `State`：状态读取的通用类型，表示 `SignalState` 或 `StoreState`。

对业务消费方来说，状态整体都通过 `$()` 读取：

```tsx
$(count)
$(user)
```

只有 `StoreState` 承诺字段读取：

```tsx
$(user.name)
$(user.profile.avatar)
```

`StoreState` 的 setter 兼容 `SignalState` 的整体写入方式，并额外支持 selector 字段写入。

## 创建状态

`createState()` 的第一个参数是初始值本身，第二个参数是配置对象。

初始值可以不传。不传时状态当前值是 `undefined`，类型也应包含 `undefined`。这个语义对齐前端开发者熟悉的 React `useState<T>()` 心智。

配置对象当前只定义 `mode`：

- `signal`：默认模式，使用 `createSignal`，返回 `SignalState`。
- `store`：强制使用 `createStore`，返回 `StoreState`。

允许：

```tsx
const [count, setCount] = createState(0)
const [keyword, setKeyword] = createState('')
const [canvas, setCanvas] = createState<HTMLCanvasElement>()

const [user, setUser] = createState({
  name: '',
  profile: {
    avatar: '',
  },
})

const [settings, setSettings] = createState(initialSettings, { mode: 'store' })
const [payload, setPayload] = createState(objectPayload)
```

禁止：

```tsx
const [count] = createSignal(0)
const [user, setUser] = createStore(...)
```

## 默认模式

`signal` 是默认模式。

不写 `mode` 时，无论初始值是什么，都使用 `createSignal`。

默认 signal 包括：

- string
- number
- boolean
- undefined
- null
- array
- object literal
- Date
- Map
- Set
- class instance

只有显式传入 `{ mode: 'store' }` 时，才创建 `StoreState`。

允许：

```tsx
const [form, setForm] = createState(
  {
    name: '',
    profile: {
      avatar: '',
    },
  },
  { mode: 'store' },
)
```

不要靠初始值形状暗中推断 store。对象字面量默认也是 signal，只有写出 `{ mode: 'store' }` 才表示调用方确实需要字段级 store 写入能力。

## 读取状态

读取状态只能使用 `$()`。

允许：

```tsx
$(count)
$(user)
$(user.name)
$(user.profile.avatar)
```

禁止：

```tsx
count()
user()
user.name()
user.profile.avatar()
```

对象状态都可以读取整体。只有显式 `{ mode: 'store' }` 创建的 `StoreState` 可以读取字段。`$(user)` 表示读取整个当前对象，`$(user.name)` 表示读取 store 字段当前值。

## 修改 SignalState

`SignalState` 的 setter 只接收新值或更新函数。

允许：

```tsx
setCount(1)
setCount((value) => value + 1)
setPayload(nextPayload)
```

禁止：

```tsx
count.set(...)
count.update(...)
```

## 修改 StoreState

`StoreState` 的 setter 兼容整体写入，也可以使用 selector 选择字段写入路径。

允许：

```tsx
setUser(nextUser)
setUser((user) => ({
  ...user,
  name: 'Eds',
}))

setUser((state) => state.name, 'Eds')
setUser((state) => state.profile.avatar, '/avatar.png')
setUser((state) => state.profile.avatar, (avatar) => avatar.trim())
```

禁止：

```tsx
setUser('name', 'Eds')
setUser('profile', 'avatar', '/avatar.png')

user.set(...)
user.patch(...)
user.name.set(...)
user.profile.avatar.set(...)
```

`State` 是只读状态，写权限不能挂在 `State` 上。

## 组件边界

默认只向子组件传 `State`，不传解包后的动态值。

允许：

```tsx
<UserCard
  name={user.name}
  avatar={user.profile.avatar}
/>
```

禁止：

```tsx
<UserCard
  name={$(user.name)}
  avatar={$(user.profile.avatar)}
/>
```

除非该 prop 明确是静态值，否则动态 props 必须使用 `State<T>` 或 `MayState<T>`。

`MayState<T>` 表示可继续传递的值来源：它可以是普通值，也可以是 `State<T>`。组件 props 和能力 options 默认优先使用 `MayState<T>`，让调用方可以传动态状态，也可以传静态值。

## 写权限

读取权可以下放，写入权必须收敛。

只有这些主体可以持有 setter：

- 状态拥有者组件
- 表单控制器组件
- 业务控制器组件
- 明确负责修改状态的编辑器组件

展示组件、叶子 UI 组件、纯渲染组件默认禁止持有 setter。

## 派生状态

派生 UI 状态使用 `createMemo` 或项目封装后的派生 `State`。

禁止用 `createEffect` 计算派生 UI 状态，禁止用 effect 维护另一个普通状态来模拟 computed。

`createEffect` 只用于同步外部系统，例如：

- DOM API
- localStorage
- network subscription
- websocket
- third-party library
- browser side effect

## 命名

状态变量不加 `State` 后缀。

允许：

```tsx
const [user, setUser] = createState(...)
```

禁止：

```tsx
const [userState, setUserState] = createState(...)
```

`user` 表示状态，`$(user)` 表示当前值，`setUser` 表示唯一写入口。

## 检查清单

- 业务代码是否只用 `createState()` 创建动态状态
- 动态读取是否全部通过 `$()`
- setter 是否只留在真正拥有写权限的主体里
- 动态 props 是否传 `State` 而不是解包值
- 需要 store 时是否显式写出 `{ mode: 'store' }`
- store setter 是否在整体写入外，只用 selector 写字段路径
- effect 是否只用于同步外部系统
