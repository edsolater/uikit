/** 保存 CSS 对象的连接，提供显式派生及沿依赖传播的激活。 */
import { deriveObject } from '../fnkit/derivable-object'

/** 可直接组合的 CSS 对象；连接与激活不更换对象身份，调用才派生。 */
export interface Block {
  /** 从当前属性和连接派生，子对象引用保持共享。 */
  (): this
  kind: string
  children: Block[]
  dependence: Block[]
  isActive: boolean
  /** 首次接通时执行，派生后使用新对象作为 this。 */
  onActive?: (this: Block) => void
  /** 保存实际输入对象，已接通时立即激活新增对象。 */
  attach(...blocks: Block[]): this
  /** 接通当前对象及其依赖、子级，不求取字符串。 */
  activate(): void
  /** 取得语义字段中的依赖，额外 dependence 由共同激活机制处理。 */
  getDependencies(): Block[]
  /** 最终提交 CSS 时解析当前结构。 */
  parseCss(): string
}

/** 构造时定义额外依赖、首次激活动作及语义派生规则。 */
export interface BlockOptions<T extends object = object> {
  dependence?: Block[]
  onActive?: (this: Block) => void
  /** 扩展最终解析，不在构造或激活时调用。 */
  parseCss?: (this: Block & T) => string
  /** 从对象字段取得依赖，避免另存一份值关系。 */
  getDependencies?: (this: Block & T) => Block[]
}

/** 所有语义派生共用的方法，不闭包持有某个对象的状态。 */
const blockMethods = {
  /** 按输入顺序保存对象，返回接收者。 */
  attach(this: Block, ...blocks: Block[]) {
    this.children.push(...blocks)
    if (this.isActive) blocks.forEach(child => child.activate())
    return this
  },
  /** 先标记接通，再传播，确保共享依赖只执行一次激活动作。 */
  activate(this: Block) {
    if (this.isActive) return
    this.isActive = true
    for (const dependency of [...this.dependence, ...this.getDependencies(), ...this.children]) dependency.activate()
    this.onActive?.()
  },
  /** 普通组合没有额外的语义字段依赖。 */
  getDependencies(): Block[] { return [] },
  /** 按顺序展开子对象，不添加花括号。 */
  parseCss(this: Block): string { return this.children.map(child => child.parseCss()).join('\n') },
}

/** 创建有自己连接和状态的 Block，语义构造器可补充字段与解析方法。
 * @example
 * const shared = block().attach(property('color', value('blue')))
 * const independent = shared()
 * // 工具定义端补充语义字段及最终解析，业务组合不写解析模板。
 * const literal = block({ raw: '2px' }, {
 *   parseCss() { return this.raw },
 * })
 */
export function block<T extends object = object>(properties?: T, options?: BlockOptions<T>): Block & T {
  return deriveObject(
    {
      kind: 'block', ...properties,
      children: [] as Block[], dependence: [...(options?.dependence ?? [])],
      isActive: false, onActive: options?.onActive,
      ...blockMethods,
      parseCss: options?.parseCss ?? blockMethods.parseCss,
      getDependencies: options?.getDependencies ?? blockMethods.getDependencies,
    },
    /** 集合由通用派生提供浅层写时复制；Block 只覆盖生命周期状态。 */
    { overrideWhenDerive: { isActive: false } },
  ) as Block & T
}

/** 判断对象是否提供共同组合和激活能力。 */
export function isBlock(input: unknown): input is Block {
  return typeof input === 'function' && 'attach' in input && 'activate' in input && 'parseCss' in input
}
