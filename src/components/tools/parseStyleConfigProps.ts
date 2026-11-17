/**
 * Kit 样式属性的输入归一。
 *
 * 将美元前缀属性聚合为原有 styleConfig，并保持显式配置的字段优先级。
 *
 * 让组件核心与输入控制只消费一份配置，不承担调用语法转换。
 */
import { val, type Val } from '@/foundation'

/** 调用端从原配置值域取得美元前缀属性，规范化 Props 与 Controller 不增加别名字段。 */
export type StyleConfigInputProps<Props> = Props extends {
  styleConfig?: infer Config
}
  ? Props & {
      [Key in keyof NonNullable<Val<Config>> as Key extends string
        ? `$${Key}`
        : never]?: NonNullable<Val<Config>>[Key]
    }
  : Props

/**
 * 将美元前缀属性归入 styleConfig 的惰性输入视图，普通属性保持原值与身份。
 * 显式配置中的同名字段优先，包括 undefined；字段 Source 继续由原消费链读取。
 *
 * @example
 * const props = parseStyleConfigProps({ $direction: 'column', styleConfig: { gap: '2rem' } })
 * props.styleConfig // { direction: 'column', gap: '2rem' }
 */
export function parseStyleConfigProps<Props extends object>(props: Props): Props {
  /**
   * 判断属性是否属于仅在调用入口使用的样式别名。
   */
  const isStyleKey = (key: PropertyKey): key is `$${string}` =>
    typeof key === 'string' && key.startsWith('$')
  /**
   * 取得当前待聚合的属性名，保留动态展开输入的字段形状。
   */
  const styleKeys = () => Reflect.ownKeys(props).filter(isStyleKey)
  /**
   * 在实际读取时取得配置，保留整体配置替换及字段来源的更新。
   */
  const read = (key: string | symbol) => {
    if (isStyleKey(key)) return undefined
    const value = Reflect.get(props, key)
    if (key !== 'styleConfig') return value
    const keys = styleKeys()
    if (keys.length === 0) return value
    return {
      ...Object.fromEntries(
        keys.map((name) => [name.slice(1), Reflect.get(props, name)]),
      ),
      ...val(value),
    }
  }
  return new Proxy({} as Props, {
    get: (_, key) => read(key),
    has: (_, key) =>
      !isStyleKey(key) &&
      (key in props || (key === 'styleConfig' && styleKeys().length > 0)),
    ownKeys: () => {
      const keys = Reflect.ownKeys(props).filter((key) => !isStyleKey(key))
      if (!keys.includes('styleConfig') && styleKeys().length > 0)
        keys.push('styleConfig')
      return keys
    },
    getOwnPropertyDescriptor: (_, key) => {
      if (isStyleKey(key)) return
      const descriptor = Reflect.getOwnPropertyDescriptor(props, key)
      if (!descriptor && !(key === 'styleConfig' && styleKeys().length > 0))
        return
      return {
        configurable: true,
        enumerable: descriptor?.enumerable ?? true,
        get: () => read(key),
      }
    },
  })
}
