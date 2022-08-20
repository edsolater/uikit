import { assert } from '@edsolater/fnkit'
import { useEvent, useResizeObserver, attachPointerMove } from '@edsolater/hookit'
import { Fragment, useEffect, useRef } from 'react'
import { setInlineStyle } from '../functions/dom/setCSS'
import { assertFunctionNotInvokeTooFrequently } from '../functions/fnkit/assertFunctionNotInvokeTooFrequently'
import { mapElementChildren } from '../functions/react'
import { AddProps } from './AddProps'
import { Col } from './Col/Col'
import { Div, DivProps } from './Div/Div'
import { createDataTag, htmlHasTag } from './Div/tag'
import { ExpandClickableArea } from './ExpandClickableArea'
import { RowProps, Row } from './Row/Row'

export type RowSplitProps = RowProps & { dir?: 'row' | 'col'; lineProps?: DivProps }
/**
 * ! should out-most Wrapper not depends on inner box's size
 */
export function SplitView({ lineProps, dir = 'row', ...divProps }: RowSplitProps) {
  // leftView and line and rightView
  const refs = useRef<{ line: HTMLElement; prevWindowItem?: HTMLElement; nextWindowItem?: HTMLElement }[]>([])

  const getFlexibleIndex = () => {
    const flexibleViewIndex = refs.current
      .map(({ prevWindowItem }) => prevWindowItem)
      .findIndex((i) => i && htmlHasTag(i, flexiableViewTag))
    const flexibleViewIndexWithDefault = flexibleViewIndex >= 0 ? flexibleViewIndex : refs.current.length - 1 // last one is flexible in default
    return flexibleViewIndexWithDefault
  }

  //#region ------------------- feature move line -------------------
  useEffect(() => {
    const flexibleViewIndex = getFlexibleIndex()
    // regist move line handler
    refs.current.forEach(({ prevWindowItem, line, nextWindowItem }, idx) => {
      if (idx >= flexibleViewIndex) {
        if (!nextWindowItem) return
        let initWidth = nextWindowItem.clientWidth
        let initHeight = nextWindowItem.clientHeight
        attachPointerMove(line, {
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
      } else {
        if (!prevWindowItem) return
        let initWidth = prevWindowItem.clientWidth
        let initHeight = prevWindowItem.clientHeight
        attachPointerMove(line, {
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
      }
    })

    //TODO: fix container's width/height  /or should?🤔, not you shouldn't, just fixed height in example
    // TODO: expand line hoverable area
    // TODO: extract main feature to hook, for easier managements
  }, [])
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
      {...divProps}
      icss_={[
        { display: 'flex', flexDirection: dir === 'row' ? undefined : 'column' },
        { height: '100%', width: '100%', contain: 'size' },
        divProps.icss
      ]}
      domRef_={[wrapperRef, divProps.domRef]}
    >
      {mapElementChildren(divProps.children, (childNode, idx) => {
        console.log('childNode: ', childNode)
        return (
          <Fragment key={idx}>
            {/*  View  */}
            <AddProps
              domRef={(el) => {
                // update to prevGroup
                if (idx >= 1) {
                  refs.current[idx - 1] = { ...refs.current[idx - 1], nextWindowItem: el }
                }
                // update to currGroup
                refs.current[idx] = { ...refs.current[idx], prevWindowItem: el }
              }}
              icss={{ flex: 1, willChange: 'width, height', transition: '75m' }}
            >
              {childNode}
            </AddProps>

            {/* Line */}
            <ExpandClickableArea
              {...lineProps}
              dir='x'
              icss={[
                {
                  ':last-child': {
                    display: 'none'
                  }, // TODO: should not render this DOM
                  flex: 'none',
                  cursor: dir === 'row' ? 'e-resize' : 'n-resize'
                },
                lineProps?.icss
              ]}
              className={['hover-group', lineProps?.className]}
              domRef={[(el) => (refs.current[idx] = { ...refs.current[idx], line: el }), lineProps?.domRef]}
            >
              <Div
                icss_={[
                  {
                    backgroundColor: '#80808033',
                    '.hover-group:hover &': { backgroundColor: 'dodgerblue' }, // FIXME should have hover group
                    transition: '75ms'
                  },
                  dir === 'row' ? { width: 2, height: '100%' } : { height: 2, width: '100%' }
                ]}
              ></Div>
            </ExpandClickableArea>
          </Fragment>
        )
      })}
    </Div>
  )
}

const flexiableViewTag = createDataTag({ key: 'SplitView', value: 'view-flexible' })
const hiddenViewTag = createDataTag({ key: 'SplitView', value: 'view-hidden' })
SplitView.tag = {
  flexiable: flexiableViewTag,
  hidden: hiddenViewTag
}
