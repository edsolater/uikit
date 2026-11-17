/**
 * Kit 样式属性的输入归一。
 *
 * 将美元前缀属性聚合为组件声明的样式配置入口，并保持显式配置的字段优先级。
 *
 * 让组件核心与输入控制只消费一份配置，不承担调用语法转换。
 */
import { val, type Val } from '@/foundation'

/** 调用端从原配置值域取得美元前缀属性，规范化 Props 与 Controller 不增加别名字段。 */
export type StyleConfigInputProps<Props> = '$styleConfig' extends keyof Props
  ? Props & NonNullable<Val<Props['$styleConfig']>>
  : Props

/**
 * 将美元前缀属性归入组件声明的配置入口，普通属性保持原值与身份。
 * 显式配置中的同名字段优先，包括 undefined；字段 Source 继续由原消费链读取。
 * 没有直接样式字段需要聚合时返回原对象，配置容器自身不参与字段聚合。
 *
 * @example
 * const props = parseStyleConfigProps({ $gap: '1rem', $styleConfig: { $gap: '2rem' } })
 * props.$styleConfig // { $gap: '2rem' }
 */
export function parseStyleConfigProps<Props extends object>(props: Props): Props {
  /**
   * 判断属性是否属于仅在调用入口使用的样式别名。
   */
  const isStyleKey = (key: PropertyKey): key is `$${string}` =>
    typeof key === 'string' && key.startsWith('$') && key !== '$styleConfig'
  /**
   * 取得当前待聚合的属性名，保留动态展开输入的字段形状。
   */
  const styleKeys = () => Reflect.ownKeys(props).filter(isStyleKey)
  if (styleKeys().length === 0) return props
  /**
   * 在实际读取时取得配置，保留整体配置替换及字段来源的更新。
   */
  const read = (key: string | symbol) => {
    if (isStyleKey(key)) return undefined
    const value = Reflect.get(props, key)
    if (key !== '$styleConfig') return value
    const keys = styleKeys()
    if (keys.length === 0) return value
    return {
      ...Object.fromEntries(
        keys.map((name) => [name, Reflect.get(props, name)]),
      ),
      ...val(value),
    }
  }
  return new Proxy({} as Props, {
    get: (_, key) => read(key),
    has: (_, key) =>
      !isStyleKey(key) &&
      (key in props || (key === '$styleConfig' && styleKeys().length > 0)),
    ownKeys: () => {
      const keys = Reflect.ownKeys(props).filter((key) => !isStyleKey(key))
      if (!keys.includes('$styleConfig') && styleKeys().length > 0)
        keys.push('$styleConfig')
      return keys
    },
    getOwnPropertyDescriptor: (_, key) => {
      if (isStyleKey(key)) return
      const descriptor = Reflect.getOwnPropertyDescriptor(props, key)
      if (!descriptor && !(key === '$styleConfig' && styleKeys().length > 0))
        return
      return {
        configurable: true,
        enumerable: descriptor?.enumerable ?? true,
        get: () => read(key),
      }
    },
  })
}
