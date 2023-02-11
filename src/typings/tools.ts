import { AnyFn, DeMayFn, NoNullablePrimitive } from '@edsolater/fnkit'
import { RefObject } from 'react'
import { DivChildNode, DivProps } from '../Div'

export type MayArray<T> = T | Array<T>

export type MayDeepArray<T> = T | Array<MayDeepArray<T>>

export type MayFunction<T, Params extends any[] = any[]> = T | ((...params: Params) => T)

/**
 * 能有enum提示，同时，传入其他string也不报错
 * @example
 * const e = MayEnum<'hello'|'world'> // 'hello' | 'world' | (string & {})
 */
export type MayEnum<T> = T | (string & {})

/**
 * type I = GetRequired<{ foo: number, bar?: string }> // expected to be { foo: number }
 */
// type GetRequired<T> = { [P in keyof T as T[P] extends Required<T>[P] ? P : never]: T[P] };

/**
 * type I = GetOptional<{ foo: number, bar?: string }> // expected to be { bar?: string }
 */
// type GetOptional<T> = {[P in keyof T as T[P] extends Required<T>[P] ? never: P]: T[P]}

/**
 * 获取对象的所有非方法的属性名
 * @example
 * Properties<{a: number, b: true, c(): boolean}> // 'a' | 'b'
 */
export type Properties<O, T = keyof O> = T extends keyof O ? (O[T] extends () => void ? never : T) : never

/**
 * 获取对象的所有方法名
 * @example
 * Properties<{a: number, b: true, c(): boolean}> // 'c'
 */
export type Methods<O> = Exclude<keyof O, Properties<O>>

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: undefined }
/**
 * 两个类型互斥（只能二选一）
 * @example
 * type F = XOR<{ d: '2' }, { a: 1; b: true; c(): boolean }>
 * const d: F = { a: 1, b: true, c: () => true } // OK
 * const d: F = { d: '2' } // OK
 * const d: F = { a: 1, b: true, c: () => true, d: '2' } // Error
 */
export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U

/**
 * 只选取满足条件的属性名
 * @example
 * PickByValue<{a: boolean, b: boolean, c: string}, boolean> // {a: boolean, b: boolean}
 */
export type PickByValue<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

/**
 * 只选取不满足条件的属性名
 * @example
 * OmitByValue<{a: undefined, b: undefined, c: string}, undefined> // {c: string}
 */
export type OmitByValue<T, U> = { [P in keyof T]: T[P] extends U ? never : P }[keyof T]

/**
 * 删除 属性值为undefined的属性
 * @example
 * NotUndefinedValue<{a: number, b: never}> // {a: number}
 */
export type NotUndefinedValue<O> = {
  [Q in OmitByValue<O, undefined>]: O[Q]
}

/**
 * @example
 * ExtractProperty<{ key: 'hello' }, 'key'> // "hello"
 */
export type ExtractProperty<O, P extends keyof any, Fallback extends keyof any = any> = O extends {
  [Key in P]: infer K
}
  ? K extends any
    ? K
    : Fallback
  : Fallback

/**
 * @example
 * ArrayItem<['hello', 'world']> // "hello" | "world"
 */
export type ArrayItem<A> = A extends readonly (infer T)[] ? T : any

//#region ------------------- word case -------------------
/**
 * @example
 * PascalCaseFromKebabCase<'hello-world'> // 'HelloWrold'
 * PascalCaseFromKebabCase<'hello-world-hi'> // 'HelloWroldHi'
 * PascalCaseFromKebabCase<'hello-world-hi-i'> // 'HelloWroldHiI'
 * PascalCaseFromKebabCase<'hello-world-hi-I-am'> // 'HelloWroldHiIAm'
 * PascalCaseFromKebabCase<'hello-world-hi-I-am-Ed'> // 'HelloWroldHiIAmEd'
 */
export type PascalCaseFromKebabCase<S extends string> =
  S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}-${infer p6}-${infer p7}`
    ? `${Capitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}${Capitalize<p5>}${Capitalize<p6>}${Capitalize<p7>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}-${infer p6}`
    ? `${Capitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}${Capitalize<p5>}${Capitalize<p6>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}`
    ? `${Capitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}${Capitalize<p5>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}`
    ? `${Capitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}`
    ? `${Capitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}`
    : S extends `${infer p1}-${infer p2}`
    ? `${Capitalize<p1>}${Capitalize<p2>}`
    : S

/**
 * @example
 * PascalCaseFromCamelCase<'helloWorld'> // 'HelloWrold'
 */
export type PascalCaseFromCamelCase<S extends string> = Capitalize<S>

/**
 * @example
 * PascalCase<'helloWorld'> // 'HelloWrold'
 * PascalCase<'helloWorldHi'> // 'HelloWroldHi'
 * PascalCase<'hello-world'> // 'HelloWrold'
 * PascalCase<'hello-world-hi'> // 'HelloWroldHi'
 * PascalCase<'hello-world-hi-i'> // 'HelloWroldHiI'
 * PascalCase<'hello-world-hi-I-am'> // 'HelloWroldHiIAm'
 * PascalCase<'hello-world-hi-I-am-Ed'> // 'HelloWroldHiIAmEd'
 */
export type PascalCase<S extends string> = PascalCaseFromKebabCase<Capitalize<S>>

/**
 * @example
 * PascalCaseFromKebabCase<'hello-world'> // 'helloWrold'
 * PascalCaseFromKebabCase<'hello-world-hi'> // 'helloWroldHi'
 * PascalCaseFromKebabCase<'hello-world-hi-i'> // 'helloWroldHiI'
 * PascalCaseFromKebabCase<'hello-world-hi-I-am'> // 'helloWroldHiIAm'
 * PascalCaseFromKebabCase<'hello-world-hi-I-am-Ed'> // 'helloWroldHiIAmEd'
 */
export type CamelCaseFromKebabCase<S extends string> =
  S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}-${infer p6}-${infer p7}`
    ? `${Uncapitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}${Capitalize<p5>}${Capitalize<p6>}${Capitalize<p7>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}-${infer p6}`
    ? `${Uncapitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}${Capitalize<p5>}${Capitalize<p6>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}`
    ? `${Uncapitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}${Capitalize<p5>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}`
    ? `${Uncapitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}${Capitalize<p4>}`
    : S extends `${infer p1}-${infer p2}-${infer p3}`
    ? `${Uncapitalize<p1>}${Capitalize<p2>}${Capitalize<p3>}`
    : S extends `${infer p1}-${infer p2}`
    ? `${Uncapitalize<p1>}${Capitalize<p2>}`
    : S

/**
 * @example
 * CamelCaseFromPascalCase<'HelloWorld'> // 'helloWrold'
 */
export type CamelCaseFromPascalCase<S extends string> = Uncapitalize<S>

/**
 * @example
 * CamelCase<'helloWorld'> // 'HelloWrold'
 * CamelCase<'helloWorldHi'> // 'HelloWroldHi'
 * CamelCase<'hello-world'> // 'HelloWrold'
 * CamelCase<'hello-world-hi'> // 'HelloWroldHi'
 * CamelCase<'hello-world-hi-i'> // 'HelloWroldHiI'
 * CamelCase<'hello-world-hi-I-am'> // 'HelloWroldHiIAm'
 * CamelCase<'hello-world-hi-I-am-Ed'> // 'HelloWroldHiIAmEd'
 */
export type CamelCase<S extends string> = CamelCaseFromKebabCase<Uncapitalize<S>>

/**
 * !!! only support kebab-case => snake_case yet!!!
 */
export type SnakeCase<S extends string> =
  S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}-${infer p6}-${infer p7}`
    ? `${p1}_${p2}_${p3}_${p4}_${p5}_${p6}_${p7}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}-${infer p6}`
    ? `${p1}_${p2}_${p3}_${p4}_${p5}_${p6}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}-${infer p5}`
    ? `${p1}_${p2}_${p3}_${p4}_${p5}`
    : S extends `${infer p1}-${infer p2}-${infer p3}-${infer p4}`
    ? `${p1}_${p2}_${p3}_${p4}`
    : S extends `${infer p1}-${infer p2}-${infer p3}`
    ? `${p1}_${p2}_${p3}`
    : S extends `${infer p1}-${infer p2}`
    ? `${p1}_${p2}`
    : S
//#endregion

//#region ------------------- keyof / valueof -------------------
export type Keyof<O> = keyof O
export type Valueof<O> = O[keyof O]
/**
 * extract only string and number
 */
export type SKeyof<O> = O extends { [s in infer T]: any } ? T : any
/**
 * extract only string and number
 */
export type SValueof<O> = O extends { [s: string]: infer T } ? T : any
//#endregion

export type GetComponentProps<T extends (...args: any[]) => any> = Parameters<T>[0]
export type Component<Props> = (props: Props) => DivChildNode
export type ReactComponent<Props> = (props: Props) => JSX.Element
export type ControllerRef<T> = RefObject<any> | ((controller: T) => void)

export type ValidProps = Record<string, Exclude<any, Promise<any>>>
export type ValidStatus = object

export type ValidPromisePropsConfig<Props extends ValidProps> = {
  [K in keyof Props as `${K & string}MayPromise`]?: boolean
} & {
  [K in keyof Props as `${K & string}PromiseFallback`]?: Props[K]
}

type InjectStatusToFirstParam<T, Status extends ValidStatus = {}> = T extends (
  ...args: [infer F, ...infer Rest]
) => infer R
  ? T extends () => infer R
    ? (status: Status) => R
    : (...args: [utils: F extends Record<keyof any, any> ? F & Status : F, ...args: Rest]) => R
  : T
type DeInjectStatusToFirstParam<T, Status extends ValidStatus = {}> = T extends (
  ...args: [infer F, ...infer Rest]
) => infer R
  ? T extends () => infer R
    ? (status: Status) => R
    : (...args: [utils: F extends Record<keyof any, any> ? F & Status : F, ...args: Rest]) => R
  : T

export type AddDefaultType<T, U extends T> = T extends any | undefined ? U : T
/**
 * make props can have function / async function / promise (except special named props)
 */
export type PivifyProps<P extends ValidProps, Status extends ValidStatus = {}> = {
  [K in keyof P]: K extends
    | keyof DivProps
    | `${string}${Capitalize<keyof DivProps>}`
    | `_${string}`
    | `on${string}` // function must start with 'on'
    | `render${string}`
    | `get${string}`
    ? P[K]
    : PivifyOneProps<P[K], Status>
}
export type DepivifyProps<P> = {
  [K in keyof P]: K extends
    | keyof DivProps
    | `${string}${Capitalize<keyof DivProps>}`
    | `_${string}`
    | `on${string}` // function must start with 'on'
    | `render${string}`
    | `get${string}`
    ? P[K]
    : DepivifyOneProps<P[K]>
}
export type PivifyOneProps<T, Status extends ValidStatus> =
  | T
  | Promise<T>
  | ((status: Status) => Promise<T>)
  | ((status: Status) => T)

export type DepivifyOneProps<T> = Awaited<DeMayFn<T>>

/**
 * auto omit P2's same name props
 */
export type ExtendsProps<
  P1 extends ValidProps,
  P2 extends ValidProps = {},
  P3 extends ValidProps = {},
  P4 extends ValidProps = {},
  P5 extends ValidProps = {}
> = P1 &
  Omit<P2, keyof P1> &
  Omit<P3, keyof P1 | keyof P2> &
  Omit<P4, keyof P1 | keyof P2 | keyof P3> &
  Omit<P5, keyof P1 | keyof P2 | keyof P3 | keyof P4>
