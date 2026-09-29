/** Map 与 WeakMap 的类型增强：允许 undefined 查询。

项目约定不存储 undefined 键；它表示缺失，查询结果也为 undefined。

这是使用约定，不增加运行时检查。未知输入的识别由业务登记表负责，不放宽全局查询。
*/
export {}

declare global {
  interface WeakMap<K extends WeakKey, V> {
    get(key: undefined): undefined
    /** 允许合法键与 undefined 的联合输入，结果仍可能未命中。 */
    get(key: K | undefined): V | undefined
  }

  interface Map<K, V> {
    get(key: undefined): undefined
    /** 允许合法键与 undefined 的联合输入，结果仍可能未命中。 */
    get(key: K | undefined): V | undefined
  }
}
