import { isValidElement, ReactNode, useEffect, useMemo, useRef } from 'react'

import { getEntryKey, getEntryValue, getKeys, groupBy, map, max, min, sum, toEntries } from '@edsolater/fnkit'

import { isHTMLDivElement } from '../domHelpers/isHTMLElement'
import { setCSSVariable } from '../functions/dom/setCSS'
import { inClient } from '../functions/isSSR'
import Div from './Div'
import { DivProps } from './Div'
import { useForceUpdate } from '../hooks/useForceUpdate'
import { icssNoScrollbar, icssStratchableHeight } from '../styles'

type ItemInfoMap = Map<
  HTMLElement,
  {
    visiable?: boolean
    offsetLoopTurn?: number
    order: number
    unsortedOrder: number
  }
>

const EMPTY_ITEM_INFO_MAP = new Map() as ItemInfoMap

/**
 * first step of struture CycleScroll
 */
function getSorted<T>(items: T[], focusItemIdx: number): T[] {
  if (items.length <= 1) return items

  const offsetFromUnsorted = focusItemIdx
  const offsetFromSorted = Math.floor(items.length / 2)
  const diffOffset = offsetFromUnsorted - offsetFromSorted
  const resorted = [...items, ...items, ...items].slice(
    items.length + diffOffset,
    items.length + diffOffset + items.length
  )
  return resorted
}

export default function CycleScroll({
  items: unsortedItems,
  selectedIndex,
  ...divProps
}: { items: ReactNode[]; selectedIndex?: number } & DivProps) {
  // re-getSorted will preduce a different order array, witch will force react to re-render without
  // firstSelectedIndex will let the newArray stay the same order as the old one, so react will reuse the old dom
  const firstSelectedIndex = useRef(selectedIndex ?? 0)
  const items = useMemo(() => getSorted(unsortedItems, firstSelectedIndex.current), [unsortedItems])

  const [signalToCalculateItemPosition, startToCalculateItemPosition] = useForceUpdate()

  // bug is: wrap container is not ready(can't scroll to last items)
  const groupBox = useRef<HTMLElement>()

  const itemInfos = useRef<ItemInfoMap>(new Map())

  const itemLength = items.length
  const itemDoms = getKeys(itemInfos.current)
  const itemHeights = map(itemDoms, (itemDom) => itemDom.clientHeight)
  const itemWidths = map(itemDoms, (itemDom) => itemDom.clientWidth)

  const totalHeight = sum(itemHeights)
  const maxItemWidth = max(itemWidths)

  const baseScrollOffset = useRef(0)
  // flag for stop to change {@link baseScrollOffset}
  const haveInitlyScroll = useRef(false)

  if (!haveInitlyScroll.current && itemDoms.length === items.length) {
    baseScrollOffset.current = totalHeight * 10
  }

  useEffect(() => {
    // use useEffect to let DOM be ready
    if (!haveInitlyScroll.current && baseScrollOffset.current && groupBox.current) {
      const [selectItemDom] =
        [...itemInfos.current.entries()].find(([, itemInfo]) => itemInfo.unsortedOrder === selectedIndex) ?? []
      selectItemDom?.scrollIntoView({ block: 'center' })
      haveInitlyScroll.current = true
    }
  })

  useEffect(() => {
    // use useEffect to scroll smooth
    if (haveInitlyScroll.current && baseScrollOffset.current && groupBox.current) {
      const [selectItemDom] =
        [...itemInfos.current.entries()].find(([, itemInfo]) => itemInfo.unsortedOrder === selectedIndex) ?? []
      selectItemDom?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [selectedIndex])

  useEffect(() => {
    if (!inClient) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!itemInfos.current) return
        // set flag infos
        entries.forEach((entry) => {
          if (!isHTMLDivElement(entry.target)) return
          itemInfos.current?.set(entry.target, {
            ...itemInfos.current.get(entry.target)!,
            visiable: entry.isIntersecting
          })
        })

        // get uppest and downest items
        const getBoundaryItems = (items?: ItemInfoMap) => {
          const entries = items ? toEntries(items) : []
          if (entries.length < 1) return {}
          const orders = entries.map((entry) => {
            const { order: originalOrder, offsetLoopTurn = 0 } = getEntryValue(entry)
            return originalOrder + offsetLoopTurn * itemLength
          })
          return { top: entries[orders.indexOf(min(orders))], bottom: entries[orders.indexOf(max(orders))] }
        }
        // set position flag
        const { shown: shownCandidates = EMPTY_ITEM_INFO_MAP, hidden: hiddenCandiates = EMPTY_ITEM_INFO_MAP } = groupBy(
          itemInfos.current,
          ({ visiable }) => (visiable ? 'shown' : 'hidden')
        )

        const { top: topShowCandidate, bottom: bottomShowCandidate } = getBoundaryItems(shownCandidates)

        if (!topShowCandidate || !bottomShowCandidate) return
        const currentTopLoopTurn = getEntryValue(topShowCandidate).offsetLoopTurn ?? 0
        const currentBottomLoopTurn = getEntryValue(bottomShowCandidate).offsetLoopTurn ?? 0

        const { upper: upCandidates = EMPTY_ITEM_INFO_MAP, downer: downCandidates = EMPTY_ITEM_INFO_MAP } = groupBy(
          hiddenCandiates,
          ({ offsetLoopTurn = 0, order: originalOrder }) => {
            const isUpper =
              offsetLoopTurn < currentTopLoopTurn ||
              (offsetLoopTurn === currentTopLoopTurn && originalOrder < getEntryValue(topShowCandidate).order)
            const isDowner =
              offsetLoopTurn > currentBottomLoopTurn ||
              (offsetLoopTurn === currentBottomLoopTurn && originalOrder > getEntryValue(bottomShowCandidate).order)
            return isUpper ? 'upper' : isDowner ? 'downer' : 'other'
          }
        )
        const upHasMore = upCandidates.size > downCandidates.size
        const downHasMore = downCandidates.size > upCandidates.size
        const { top: topEntry } = getBoundaryItems(upCandidates)
        const upItemEl = topEntry && getEntryKey(topEntry)
        const upItemInfo = topEntry && getEntryValue(topEntry)

        const { bottom: downEntry } = getBoundaryItems(downCandidates)
        const downItemEl = downEntry && getEntryKey(downEntry)
        const downItemInfo = downEntry && getEntryValue(downEntry)

        if (upHasMore) {
          if (!upItemInfo) return
          const newItemLoopTurn = (upItemInfo.offsetLoopTurn ?? 0) + 1
          upItemInfo.offsetLoopTurn = newItemLoopTurn
          totalHeight && setCSSVariable(upItemEl, '--dy', `${totalHeight * newItemLoopTurn}px`)
        }
        if (downHasMore) {
          if (!downItemInfo) return
          const newItemLoopTurn = (downItemInfo.offsetLoopTurn ?? 0) - 1
          downItemInfo.offsetLoopTurn = newItemLoopTurn
          totalHeight && setCSSVariable(downItemEl, '--dy', `${totalHeight * newItemLoopTurn}px`)
        }
      },
      { root: groupBox.current, rootMargin: '100px' }
    )

    const itemEls = Array.from(itemInfos.current?.keys() ?? [])
    itemEls.forEach((el) => observer?.observe(el))
    return () => {
      observer?.disconnect()
    }
  }, [signalToCalculateItemPosition])

  return (
    <Div
      {...divProps}
      domRef={[groupBox, divProps.domRef]}
      className={['relative', divProps.className]}
      icss={[icssNoScrollbar, icssStratchableHeight, divProps.icss]}
      style={{ width: maxItemWidth, ...divProps.style }}
    >
      {/* scroll hour  */}
      {map(items, (itemContent, idx) => (
        <Div
          key={(isValidElement(itemContent) && itemContent.key) || idx}
          domRef={[
            (el) => {
              itemInfos.current.set(el, { order: idx, unsortedOrder: unsortedItems.indexOf(itemContent) })
            },
            () => {
              if (idx === items.length - 1) {
                startToCalculateItemPosition()
              }
            }
          ]}
          icss={{
            position: 'absolute',
            transform: 'translateY(var(--dy, 0px))'
          }}
          style={{
            top: itemHeights.length ? `${sum(itemHeights.slice(0, idx)) + baseScrollOffset.current}px` : undefined,
            width: itemWidths.length ? '-webkit-fill-available' : undefined
          }}
        >
          {itemContent}
        </Div>
      ))}
    </Div>
  )
}
