/** 建立由独立 CssBox 包裹、可持续挂载的不透明 CssBlock。 */
import { createCssBox, type CssBox, type CssBoxContent } from './css-box'

const cssBlockIdentity = Symbol('CssBlock')
const boxesByBlock = new WeakMap<CssBlock, CssBox>()

export interface CssBlock {
  [cssBlockIdentity]: true
  /** 按调用顺序连接内容及其激活生命周期。 */
  attach: (...content: CssBoxContent[]) => CssBlock
}

/**
 * 建立具有独立外层容器的可复用 block。
 *
 * @example
 * const hidden = createCssBlock().attach(cssDeclaration('display', 'none'))
 */
export function createCssBlock(...content: CssBoxContent[]): CssBlock {
  const box = createCssBox(...content)
  let block: CssBlock

  /** 把后续结果与激活关系连接到 block 的外层容器。 */
  function attach(...nextContent: CssBoxContent[]): CssBlock {
    box.attach(...nextContent)
    return block
  }

  block = { [cssBlockIdentity]: true, attach }
  boxesByBlock.set(block, box)
  return block
}

/** 判断对象是否是由 JSS 建立的 CssBlock。 */
export function isCssBlock(value: unknown): value is CssBlock {
  return typeof value === 'object' && value !== null && boxesByBlock.has(value as CssBlock)
}

/** 在最终解析边界取得 block 一直保留的外层容器。 */
export function readCssBlock(block: CssBlock): CssBox {
  const box = boxesByBlock.get(block)
  if (!box) throw new Error('收到的对象不是由 JSS 创建的 CssBlock。')
  return box
}
