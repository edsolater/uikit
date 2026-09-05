/** 提供由 JSS core 结果组成的通用 CSS atom namespace。 */
import { createCssBlock, isCssBlock, type CssBlock } from '../core/css-block'
import { cssDeclaration } from '../core/css-declaration'
import { joinCssValues, type CssValueContent } from '../core/css-value'
import { cssColor } from '../tokens/color'
import { cssBoundary } from '../tokens/dimension'

export type CssAtomFactory<Args extends unknown[] = never[]> = (...args: Args) => CssBlock

export interface CssAtomRegistry {
  [name: string]: CssAtomFactory
  /** 取得 align-items atom。 */
  alignItems: (value: CssValueContent) => CssBlock
  /** 取得 align-self atom。 */
  alignSelf: (value: CssValueContent) => CssBlock
  /** 取得 background-color atom。 */
  backgroundColor: (value: CssValueContent) => CssBlock
  /** 取得 border atom。 */
  border: (value: CssValueContent) => CssBlock
  /** 取得 border-radius atom。 */
  borderRadius: (value: CssValueContent) => CssBlock
  /** 取得 box-shadow atom。 */
  boxShadow: (value: CssValueContent) => CssBlock
  /** 取得 color atom。 */
  color: (value: CssValueContent) => CssBlock
  /** 取得 cursor atom。 */
  cursor: (value: CssValueContent) => CssBlock
  /** 取得 display atom。 */
  display: (value: CssValueContent) => CssBlock
  /** 取得 font atom。 */
  font: (value: CssValueContent) => CssBlock
  /** 取得 font-size atom。 */
  fontSize: (value: CssValueContent) => CssBlock
  /** 取得 font-weight atom。 */
  fontWeight: (value: CssValueContent) => CssBlock
  /** 取得通用 focus ring atom。 */
  focusRing: (color?: CssValueContent, width?: CssValueContent, offset?: CssValueContent) => CssBlock
  /** 取得 gap atom。 */
  gap: (value: CssValueContent) => CssBlock
  /** 取得 inline-flex display atom。 */
  inlineFlex: () => CssBlock
  /** 取得 justify-content atom。 */
  justifyContent: (value: CssValueContent) => CssBlock
  /** 取得 line-height atom。 */
  lineHeight: (value: CssValueContent) => CssBlock
  /** 取得 min-height atom。 */
  minHeight: (value: CssValueContent) => CssBlock
  /** 取得 opacity atom。 */
  opacity: (value: CssValueContent) => CssBlock
  /** 取得 outline atom。 */
  outline: (value: CssValueContent) => CssBlock
  /** 取得 outline-offset atom。 */
  outlineOffset: (value: CssValueContent) => CssBlock
  /** 取得 padding atom。 */
  padding: (value: CssValueContent) => CssBlock
  /** 取得 transform atom。 */
  transform: (value: CssValueContent) => CssBlock
  /** 取得 transition atom。 */
  transition: (value: CssValueContent) => CssBlock
  /** 取得 user-select atom。 */
  userSelect: (value: CssValueContent) => CssBlock
}

const atomFactories = Object.create(null) as Record<string, CssAtomFactory>
export const cssAtom = atomFactories as CssAtomRegistry

/**
 * 把一个通用 atom 工厂注册到 `cssAtom`，同名注册使用最后一个工厂。
 *
 * @example
 * registerCssAtom('display', (display) => createCssBlock(cssDeclaration('display', display)))
 */
export function registerCssAtom<Args extends unknown[]>(
  name: string,
  factory: CssAtomFactory<Args>,
): CssAtomFactory<Args> {
  const atomName = name.trim()
  if (!/^[a-z][A-Za-z0-9]*$/.test(atomName)) throw new Error('CssAtom 名称必须使用 camelCase：' + name)

  /** 执行已注册工厂，并拒绝不是由 JSS 建立的返回结果。 */
  const registeredFactory = ((...args: Args) => {
    const block = factory(...args)
    if (!isCssBlock(block)) throw new Error('CssAtom “' + atomName + '”没有返回由 JSS 创建的 CssBlock。')
    return block
  }) as CssAtomFactory<Args>

  atomFactories[atomName] = registeredFactory as unknown as CssAtomFactory
  return registeredFactory
}

/**
 * 成组注册通用 atoms，并交回携带精确成员类型的同一 namespace。
 *
 * @example
 * const atoms = registerCssAtoms({
 *   hidden: () => createCssBlock(cssDeclaration('display', 'none')),
 * })
 */
export function registerCssAtoms<Factories extends Record<string, CssAtomFactory>>(
  factories: Factories,
): CssAtomRegistry & Factories {
  for (const [name, factory] of Object.entries(factories)) registerCssAtom(name, factory)
  return cssAtom as CssAtomRegistry & Factories
}

/** 注册一个以 CSS property 为内容边界的 atom。 */
function registerPropertyAtom(name: string, property: string): void {
  registerCssAtom(name, (value: CssValueContent) => createCssBlock(cssDeclaration(property, value)))
}

registerPropertyAtom('alignItems', 'align-items')
registerPropertyAtom('alignSelf', 'align-self')
registerPropertyAtom('backgroundColor', 'background-color')
registerPropertyAtom('border', 'border')
registerPropertyAtom('borderRadius', 'border-radius')
registerPropertyAtom('boxShadow', 'box-shadow')
registerPropertyAtom('color', 'color')
registerPropertyAtom('cursor', 'cursor')
registerPropertyAtom('display', 'display')
registerPropertyAtom('font', 'font')
registerPropertyAtom('fontSize', 'font-size')
registerPropertyAtom('fontWeight', 'font-weight')
registerPropertyAtom('gap', 'gap')
registerPropertyAtom('justifyContent', 'justify-content')
registerPropertyAtom('lineHeight', 'line-height')
registerPropertyAtom('minHeight', 'min-height')
registerPropertyAtom('opacity', 'opacity')
registerPropertyAtom('outline', 'outline')
registerPropertyAtom('outlineOffset', 'outline-offset')
registerPropertyAtom('padding', 'padding')
registerPropertyAtom('transform', 'transform')
registerPropertyAtom('transition', 'transition')
registerPropertyAtom('userSelect', 'user-select')

const defaultFocusColor = cssColor.accentFocus
const defaultFocusSize = cssBoundary.focus

registerCssAtom('inlineFlex', () => createCssBlock(cssAtom.display('inline-flex')))
registerCssAtom(
  'focusRing',
  (
    color: CssValueContent = defaultFocusColor,
    width: CssValueContent = defaultFocusSize,
    offset: CssValueContent = defaultFocusSize,
  ) => createCssBlock(cssAtom.outline(joinCssValues(' ', width, 'solid', color)), cssAtom.outlineOffset(offset)),
)
