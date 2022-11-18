import { useState } from 'react'

/**
 * manage search logic in a single hook. which can increase
 * @example
 * function FooComponent() {
 *    const {filter, setSearchText} = useSearchFilter<{text: string}>({getTarget: (item) => item.text })
 *    const filteredData = list.filter(filter)
 *    return (
 *      <>
 *        <input onChange={(e) => setSearchText(e.target.value)}/>
 *          {filteredData.map((item, key)=> (
 *              <div>item.text<div>
 *          ))}
 *      </>
 *    )
 * }
 */

export function useSearchFilter<Item extends any = any>(options: { getTarget: (item: Item, index: number) => string }) {
  const [searchText, setSearchText] = useState<string>()
  const [filter, setFilter] = useState<(item: Item, index: number) => boolean>(() => () => true)
  function _setSearchText(text: string) {
    setSearchText(text)
    setFilter(() => (item: Item, index: number) => {
      const targetText = options.getTarget(item, index)
      return text.split(' ').every((t) => targetText.includes(t))
    })
  }
  return { filter, setSearchText: _setSearchText, searchText }
}
