/** 建立具有外层 CssBox 的可复用结果，并管理统一工厂 registry。 */
import { cssBox, type CssBox, type CssBoxContent } from './css-box'
import { joinCssValues, type CssValueContent } from './css-value'
import { cssVariable, type CssVariable } from './css-variable'

const cssBlockIdentity = Symbol('CssBlock')
const boxesByBlock = new WeakMap<CssBlock, CssBox>()
const defaultFocusColor = cssVariable('color-accent-focus')
const defaultFocusSize = cssVariable('boundary-2')

export interface CssBlock {
  [cssBlockIdentity]: true
}

export type CssBlockFactory<Args extends unknown[] = any[]> = (...args: Args) => CssBlock

export interface CssBlocksRegistry {
  /** 取得任意已经完成 JS 注册的 block 工厂。 */
  [name: string]: CssBlockFactory

  /** 建立 align-items declaration block。 */
  alignItems: (value: CssValueContent) => CssBlock
  /** 建立 align-self declaration block。 */
  alignSelf: (value: CssValueContent) => CssBlock
  /** 建立 background-color declaration block。 */
  backgroundColor: (value: CssValueContent) => CssBlock
  /** 建立 border declaration block。 */
  border: (value: CssValueContent) => CssBlock
  /** 建立 border-radius declaration block。 */
  borderRadius: (value: CssValueContent) => CssBlock
  /** 建立 box-shadow declaration block。 */
  boxShadow: (value: CssValueContent) => CssBlock
  /** 建立 color declaration block。 */
  color: (value: CssValueContent) => CssBlock
  /** 建立 cursor declaration block。 */
  cursor: (value: CssValueContent) => CssBlock
  /** 把 value 写入指定 custom property。 */
  customProperty: (variable: CssVariable, value: CssValueContent) => CssBlock
  /** 建立 display declaration block。 */
  display: (value: CssValueContent) => CssBlock
  /** 建立 font declaration block。 */
  font: (value: CssValueContent) => CssBlock
  /** 建立 font-size declaration block。 */
  fontSize: (value: CssValueContent) => CssBlock
  /** 建立 font-weight declaration block。 */
  fontWeight: (value: CssValueContent) => CssBlock
  /** 建立通用 focus ring。 */
  focusRing: (color?: CssValueContent, width?: CssValueContent, offset?: CssValueContent) => CssBlock
  /** 建立 gap declaration block。 */
  gap: (value: CssValueContent) => CssBlock
  /** 建立 inline-flex display block。 */
  inlineFlex: () => CssBlock
  /** 建立 justify-content declaration block。 */
  justifyContent: (value: CssValueContent) => CssBlock
  /** 建立 line-height declaration block。 */
  lineHeight: (value: CssValueContent) => CssBlock
  /** 建立 min-height declaration block。 */
  minHeight: (value: CssValueContent) => CssBlock
  /** 建立 opacity declaration block。 */
  opacity: (value: CssValueContent) => CssBlock
  /** 建立 outline declaration block。 */
  outline: (value: CssValueContent) => CssBlock
  /** 建立 outline-offset declaration block。 */
  outlineOffset: (value: CssValueContent) => CssBlock
  /** 建立 padding declaration block。 */
  padding: (value: CssValueContent) => CssBlock
  /** 建立 transform declaration block。 */
  transform: (value: CssValueContent) => CssBlock
  /** 建立 transition declaration block。 */
  transition: (value: CssValueContent) => CssBlock
  /** 建立 user-select declaration block。 */
  userSelect: (value: CssValueContent) => CssBlock
}

const mutableCssBlocks = Object.create(null) as Record<string, CssBlockFactory>
export const cssBlocks: CssBlocksRegistry = mutableCssBlocks as CssBlocksRegistry

/** 把已有内容包在独立外层 box 中，形成可复用 block。 */
export function createCssBlock(...content: CssBoxContent[]): CssBlock {
  const block: CssBlock = { [cssBlockIdentity]: true }
  boxesByBlock.set(block, cssBox(...content))
  return block
}

/** 判断对象是否是由当前工具建立的 CssBlock。 */
export function isCssBlock(value: unknown): value is CssBlock {
  return typeof value === 'object' && value !== null && boxesByBlock.has(value as CssBlock)
}

/** 在最终解析边界取得 block 一直保留的外层 box。 */
export function readCssBlock(block: CssBlock): CssBox {
  const box = boxesByBlock.get(block)
  if (!box) throw new Error('收到的对象不是由 style-utils 创建的 CssBlock。')
  return box
}

/**
 * 把一个 block 工厂注册或覆盖到统一 cssBlocks namespace。
 *
 * @example
 * registerCssBlock('display', (display) => createCssBlock({ display }))
 */
export function registerCssBlock<Args extends unknown[]>(
  name: string,
  factory: CssBlockFactory<Args>,
): CssBlockFactory<Args> {
  const blockName = name.trim()
  if (!/^[a-z][A-Za-z0-9]*$/.test(blockName)) {
    throw new Error('CssBlock 名称必须使用 lower camel case：' + name)
  }

  /** 执行已注册工厂，并阻止外部实现伪造 CssBlock。 */
  const registeredFactory = ((...args: Args) => {
    const block = factory(...args)
    if (!isCssBlock(block)) {
      throw new Error('CssBlock 工厂“' + blockName + '”没有返回由 style-utils 创建的 CssBlock。')
    }
    return block
  }) as CssBlockFactory<Args>

  mutableCssBlocks[blockName] = registeredFactory as CssBlockFactory
  return registeredFactory
}

/**
 * 注册一组通用 block 工厂，并返回具有这组精确成员类型的统一 namespace。
 *
 * @example
 * const blocks = registerCssBlocks({
 *   display: (display) => createCssBlock({ display }),
 * })
 */
export function registerCssBlocks<Factories extends Record<string, CssBlockFactory>>(
  factories: Factories,
): CssBlocksRegistry & Factories {
  for (const [name, factory] of Object.entries(factories)) registerCssBlock(name, factory)
  return cssBlocks as CssBlocksRegistry & Factories
}

/** 注册一个以 CSS property 为参数边界的通用 declaration block。 */
function registerCssPropertyBlock(name: string, property: string): void {
  registerCssBlock(name, (value: CssValueContent) => createCssBlock({ [property]: value }))
}

registerCssPropertyBlock('alignItems', 'align-items')
registerCssPropertyBlock('alignSelf', 'align-self')
registerCssPropertyBlock('backgroundColor', 'background-color')
registerCssPropertyBlock('border', 'border')
registerCssPropertyBlock('borderRadius', 'border-radius')
registerCssPropertyBlock('boxShadow', 'box-shadow')
registerCssPropertyBlock('color', 'color')
registerCssPropertyBlock('cursor', 'cursor')
registerCssBlock('customProperty', (variable: CssVariable, value: CssValueContent) =>
  createCssBlock({ [variable.name]: value }),
)
registerCssPropertyBlock('display', 'display')
registerCssPropertyBlock('font', 'font')
registerCssPropertyBlock('fontSize', 'font-size')
registerCssPropertyBlock('fontWeight', 'font-weight')
registerCssPropertyBlock('gap', 'gap')
registerCssPropertyBlock('justifyContent', 'justify-content')
registerCssPropertyBlock('lineHeight', 'line-height')
registerCssPropertyBlock('minHeight', 'min-height')
registerCssPropertyBlock('opacity', 'opacity')
registerCssPropertyBlock('outline', 'outline')
registerCssPropertyBlock('outlineOffset', 'outline-offset')
registerCssPropertyBlock('padding', 'padding')
registerCssPropertyBlock('transform', 'transform')
registerCssPropertyBlock('transition', 'transition')
registerCssPropertyBlock('userSelect', 'user-select')
registerCssBlock('inlineFlex', () => createCssBlock(cssBlocks.display('inline-flex')))
registerCssBlock(
  'focusRing',
  (
    color: CssValueContent = defaultFocusColor,
    width: CssValueContent = defaultFocusSize,
    offset: CssValueContent = defaultFocusSize,
  ) => createCssBlock(cssBlocks.outline(joinCssValues(' ', width, 'solid', color)), cssBlocks.outlineOffset(offset)),
)
