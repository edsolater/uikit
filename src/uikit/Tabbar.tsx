import { createArray, ID, MayFn, shrinkToValue } from '@edsolater/fnkit'
import React, { createRef, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { Div, Item } from '.'
import { DivProps } from './Div'
import { changeReactChildren } from '../functions/react/changeReactChildren'
import { cssColors, cssTransitionTimeFnOutBack } from '../styles/cssValues'
import { setInlineStyle } from '../functions/dom/setCSS'
import { MayRef } from '../functions/react/isRefObject'
import { Nullish } from '../typings/constants'
import { useKeyboardShortcurt } from '../hooks/useKeyboardShortcurt'
import List from './List'
import { icssRow } from '../styles'

/**
 * should must inject index to this returned {@link handleItemClick}
 * @returns
 * - currentIndex - current index
 * - handleItemClick - user **must** inject this method, so {@link useTabbarIndexManager} can get item data
 * @todo keyboard navigation
 */
function useTabbarIndexManager(opts: {
  targetEl: MayRef<HTMLElement | Nullish>
  defaultIndex: number
  itemLength: number
}) {
  const [currentIndex, setCurrentIndex] = useState(opts.defaultIndex)
  const handleItemClick = useCallback((index: number) => setCurrentIndex(index), [setCurrentIndex])

  const setNextIndex = useCallback(() => setCurrentIndex((idx) => (idx + 1) % opts.itemLength), [setCurrentIndex])
  const setPrevIndex = useCallback(
    () => setCurrentIndex((idx) => (idx - 1 + opts.itemLength) % opts.itemLength),
    [setCurrentIndex]
  )
  const setFirstIndex = useCallback(() => setCurrentIndex(0), [setCurrentIndex])
  const setTheLastIndex = useCallback(() => setCurrentIndex(opts.itemLength - 1), [setCurrentIndex])

  useKeyboardShortcurt(
    opts.targetEl,
    {
      'ArrowRight': setNextIndex,
      'ArrowLeft': setPrevIndex,
      'ctrl + ArrowRight': setTheLastIndex,
      'ctrl + ArrowLeft': setFirstIndex,
      'Home': setFirstIndex,
      'End': setTheLastIndex
    },
    { preventAllBrowserKeyboardShortcut: true }
  )

  return {
    currentIndex,
    handleItemClick,
    setNextIndex,
    setPrevIndex,
    setFirstIndex,
    setTheLastIndex
  }
}

type TabbarProps = {
  id?: ID
  children?: MayFn<ReactNode, [currentNumber: number]>

  // TabbarIndexFeatureHookOptions
  defaultIndex?: number
}

/**
 * <Tabbar> self will only create a div to handle all
 * will onject onClick to  child
 * must use this with component: {@link Item}
 */
export default function Tabbar({ children, defaultIndex, id, ...divProps }: DivProps & TabbarProps) {
  const domRef = useRef<HTMLElement>(null)
  const { currentIndex, handleItemClick } = useTabbarIndexManager({
    targetEl: domRef,
    defaultIndex: defaultIndex ?? 0,
    itemLength: React.Children.count(children)
  })
  const newChildren = shrinkToValue(children, [currentIndex])
  // const refs = useRef(createArray(React.Children.count(newChildren), ()=>createRef<HTMLElement>()))
  const refs = useRef(createArray(React.Children.count(newChildren), () => createRef<HTMLElement>()))
  const attachFeatureClicked = changeReactChildren(newChildren, [
    {
      type: Item,
      props: (oldProps, node, index) => ({
        onClick: () => handleItemClick(index),
        icss: [icssRow(), { cursor: 'pointer' }],
        domRef: refs.current[index],
        as: 'li'
      })
    }
  ])
  return (
    <List
      {...divProps}
      className={['Tabbar', divProps.className]}
      icss={[icssRow({ gap: 32 }), { position: 'relative' }, divProps.icss]}
    >
      {attachFeatureClicked}
      <TabbarLineIndicator currentItemRef={refs.current[currentIndex]} />
    </List>
  )
}

function TabbarLineIndicator(props: { currentItemRef: RefObject<HTMLElement> }) {
  const indicatorRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const itemEl = props.currentItemRef.current
    const indicatorEl = indicatorRef.current
    if (indicatorEl && itemEl) {
      setInlineStyle(indicatorEl, {
        width: itemEl.clientWidth + 'px',
        left: itemEl.offsetLeft + 'px',
        top: itemEl.offsetTop + itemEl.clientHeight + 'px'
      })
    }
  }, [props.currentItemRef])
  return (
    <Div
      icss={[
        {
          position: 'absolute',
          height: 4,
          borderRadius: 4,
          minWidth: 8,
          background: cssColors.dodgerBlue,
          transition: `300ms ${cssTransitionTimeFnOutBack}`
        }
      ]}
      domRef={indicatorRef}
    ></Div>
  )
}
