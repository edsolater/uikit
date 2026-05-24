import { isObject } from '@edsolater/fnkit'

/**
 * 标识
 */
export type Brand = {
  name: string
  type: 'brand'
  /**  通过attachBrand函数附加到对象上的唯一标识符 */
  symbol: symbol
}

export type BrandValue<B extends Brand> = {
  [key in B['symbol']]: true
}

/**
 * 
 * @param obj 目标对象
 * @param brand 需要附加的标识符

 * @returns 
 */
export function attachBrand<T extends object, B extends Brand>(
  obj: T,
  brand: B,
): T & BrandValue<B> {
  try {
    ;(obj as any)[brand.symbol] = true
  } catch (error) {
    throw new Error(`Failed to attach brand ${brand.toString()} to object, obj:${JSON.stringify(obj)}:`, {
      cause: error,
    })
  }
  return obj as any
}

/** 仅在 {@link hasBrand} 中使用 */
function hasSingleBrand<B extends Brand>(
  value: object,
  targetBrand: B,
): value is BrandValue<B> {
  return (value as any)?.[targetBrand.symbol] === true
}

/** 判定是否拥有指定标记，并可排除指定标记 */
export function hasBrand<B extends Brand, Ex extends Brand>(
  value: unknown,
  targetBrand: B | B[],
  excludeBrand?: Ex | Ex[],
): value is BrandValue<B> {
  if (!isObject(value)) return false
  const brands = Array.isArray(targetBrand) ? targetBrand : [targetBrand]
  const excludes = excludeBrand ? (Array.isArray(excludeBrand) ? excludeBrand : [excludeBrand]) : []
  return (
    brands.every((brand) => hasSingleBrand(value, brand)) && excludes.every((brand) => !hasSingleBrand(value, brand))
  )
}

/** 创建一个新的品牌标记 */
export function createBrand(name: string): { name: string; type: 'brand'; symbol: symbol } {
  return {
    name,
    type: 'brand',
    symbol: Symbol(name),
  }
}
