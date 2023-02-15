import { AnyFn, assert } from '@edsolater/fnkit'
import { Fragment, useEffect, useRef } from 'react'
import { setInlineStyle } from '../utils/dom/setCSS'
import { assertFunctionNotInvokeTooFrequently } from '../utils/fnkit/assertFunctionNotInvokeTooFrequently'
import { mapElementChildren } from '../utils/react'
import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'
import { createDataTag, htmlHasTag } from '../Div/handles/tag'
import { ExpandClickableArea } from './ExpandClickableArea'
import { RowProps } from './Row'
import { useSignalState } from '../hooks/useSignalState'
import { useResizeObserver } from '../hooks/dom'
import { useEvent } from '../hooks'
import { handlePointerMove } from '../utils'

export type RowSplitProps = RowProps & DivProps & { dir?: 'row' | 'col'; lineProps?: DivProps }
/**
 * ! should out-most Wrapper not depends on inner box's size
 * it won't consider closed view, for it's too complicated
 */
export function SplitView({ lineProps, dir = 'row', ...divProps }: RowSplitProps) {
  // leftView and line and rightView
  const refs = useRef<{ line: HTMLElement; prevWindowItem?: HTMLElement; nextWindowItem?: HTMLElement }[]>([])
  const [childrenLength, setChildrenLength, getChildrenLength] = useSignalState(0)

  const getFlexibleIndex = () => {
    const flexibleViewIndex = refs.current
      .map(({ prevWindowItem }) => prevWindowItem)
      .findIndex((i) => i && htmlHasTag(i, flexiableViewTag))
    const flexibleViewIndexWithDefault = flexibleViewIndex >= 0 ? flexibleViewIndex : 0 // last one is flexible in default
    return flexibleViewIndexWithDefault
  }

  //#region ------------------- feature move line -------------------
  useEffect(() => {
    const flexibleViewIndex = getFlexibleIndex()
    const cleanFns = [] as AnyFn[]
    // regist move line handler
    refs.current.forEach(({ prevWindowItem, line, nextWindowItem }, idx) => {
      if (idx >= flexibleViewIndex) {
        if (!nextWindowItem) return
        let initWidth = nextWindowItem.clientWidth
        let initHeight = nextWindowItem.clientHeight
        const { cancel } = handlePointerMove(line, {
          move: ({ totalDelta, isFirstEvent }) => {
            if (isFirstEvent) {
              initWidth = nextWindowItem.clientWidth
              initHeight = nextWindowItem.clientHeight
            } else {
              setInlineStyle(nextWindowItem, 'flex', 'none')
              dir === 'row'
                ? setInlineStyle(nextWindowItem, 'width', initWidth - totalDelta.dx)
                : setInlineStyle(nextWindowItem, 'height', initHeight - totalDelta.dy)
            }
          }
        })
        cleanFns.push(cancel)
      } else {
        if (!prevWindowItem) return
        let initWidth = prevWindowItem.clientWidth
        let initHeight = prevWindowItem.clientHeight
        const { cancel } = handlePointerMove(line, {
          move: ({ totalDelta, isFirstEvent }) => {
            if (isFirstEvent) {
              initWidth = prevWindowItem.clientWidth
              initHeight = prevWindowItem.clientHeight
            } else {
              setInlineStyle(prevWindowItem, 'flex', 'none')
              dir === 'row'
                ? setInlineStyle(prevWindowItem, 'width', initWidth + totalDelta.dx)
                : setInlineStyle(prevWindowItem, 'height', initHeight + totalDelta.dy)
            }
          }
        })
        cleanFns.push(cancel)
      }
    })
    return () => cleanFns.forEach((fn) => fn())

    //TODO: fix container's width/height  /or should?🤔, not you shouldn't, just fixed height in example
    // TODO: expand line hoverable area
    // TODO: extract main feature to hook, for easier managements
  }, [childrenLength])
  //#endregion

  //#region ------------------- feature: auto resize base on wrapper's content React -------------------
  const wrapperRef = useRef<HTMLElement>(null)
  const wrapperInitHeight = useRef(0)
  const wrapperInitWidth = useRef(0)

  const loadInitSizeOfWrapper = () => {
    assert(wrapperRef.current, `SplitView loading failed`)
    wrapperInitWidth.current = wrapperRef.current.clientWidth
    wrapperInitHeight.current = wrapperRef.current.clientHeight
  }

  useEffect(loadInitSizeOfWrapper, [])
  // load init size of wrapper

  const handleWrapperResize = useEvent(
    (entry: ResizeObserverEntry, prevEntry: ResizeObserverEntry | undefined): void => {
      if (!refs.current.length) return // wrapper is not load yet
      assertFunctionNotInvokeTooFrequently("<SplitView>'s resizeObserver")

      const flexibleViewIndex = getFlexibleIndex()
      const prevWidth = prevEntry?.contentRect.width ?? wrapperInitWidth.current
      const prevHeight = prevEntry?.contentRect.height ?? wrapperInitHeight.current
      assert(prevWidth != null, `init width not detected`)
      assert(prevHeight != null, `init height not detected`)
      const widthDeltaPercent = entry.contentRect.width / prevWidth
      const heightDeltaPercent = entry.contentRect.height / prevHeight
      const allViews = refs.current.map((i) => i.prevWindowItem)
      allViews.forEach((view, idx) => {
        if (view && idx !== flexibleViewIndex) {
          dir === 'row'
            ? setInlineStyle(view, 'width', (w) => (w ? Number.parseFloat(w) : view.clientWidth) * widthDeltaPercent)
            : setInlineStyle(view, 'height', (h) => (h ? Number.parseInt(h) : view.clientHeight) * heightDeltaPercent)
        }
      })
    }
  )

  // resize views base on wrapper's size, to ensure proportion stable(eaqual between )
  useResizeObserver(wrapperRef, handleWrapperResize)
  //#endregion

  return (
    <Div
      shadowProps={divProps}
      icss={[
        { display: 'flex', flexDirection: dir === 'row' ? undefined : 'column' },
        { height: '100%', width: '100%', contain: 'size' },
        divProps.icss
      ]}
      domRef={[wrapperRef, divProps.domRef]}
    >
      {mapElementChildren(divProps.children, (childNode, idx, totalCount) => {
        if (totalCount !== getChildrenLength()) {
          setChildrenLength(totalCount)
        }
        return (
          <Fragment key={idx}>
            {/*  View  */}
            <Div
              domRef={(el) => {
                // update to prevGroup
                if (idx >= 1) {
                  refs.current[idx - 1] = { ...refs.current[idx - 1], nextWindowItem: el }
                }
                // update to currGroup
                refs.current[idx] = { ...refs.current[idx], prevWindowItem: el }
              }}
              icss={{
                flexGrow: 1,
                willChange: 'width, height',
                transition: '75m',
                ':empty': { display: 'none' }
              }}
            >
              {childNode}
            </Div>

            {/* Line */}
            {idx !== totalCount - 1 && (
              <ExpandClickableArea
                {...lineProps}
                dir='x'
                icss={[
                  {
                    ':last-child': {
                      display: 'none'
                    },
                    flex: 'none',
                    cursor: dir === 'row' ? 'e-resize' : 'n-resize'
                  },
                  lineProps?.icss
                ]}
                class={['hover-group', lineProps?.class]}
                domRef={[
                  (el) => {
                    return (refs.current[idx] = { ...refs.current[idx], line: el })
                  },
                  lineProps?.domRef
                ]}
              >
                <Div
                  icss={[
                    {
                      backgroundColor: '#80808033',
                      '.hover-group:hover &': { backgroundColor: 'dodgerblue' },
                      transition: '75ms'
                    },
                    dir === 'row' ? { width: 2, height: '100%' } : { height: 2, width: '100%' }
                  ]}
                ></Div>
              </ExpandClickableArea>
            )}
          </Fragment>
        )
      })}
    </Div>
  )
}

const flexiableViewTag = createDataTag({ key: 'split-view', value: 'view-flexible' })
SplitView.tag = {
  flexiable: flexiableViewTag
}
