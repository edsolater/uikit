import { assert } from '@edsolater/fnkit'
import { useResizeObserver } from '@edsolater/hookit'
import { Fragment, useEffect, useRef } from 'react'
import { attachPointerMove } from '../functions/dom/gesture/pointerMove'
import { setInlineStyle } from '../functions/dom/setCSS'
import { mapElementChildren } from '../functions/react'
import { AddProps } from './AddProps'
import { Col } from './Col'
import { Div, DivProps } from './Div'
import { createDataTag, hasTag } from './Div/tag'
import { RowProps, Row } from './Row'

export type RowSplitProps = RowProps & { dir?: 'row' | 'col'; lineProps?: DivProps }

export default function SplitView({ lineProps, dir = 'row', ...props }: RowSplitProps) {
  const refs = useRef<{ line: HTMLElement; prevWindowItem: HTMLElement; nextWindowItem?: HTMLElement }[]>([])

  const getFlexibleIndex = () => {
    const flexibleViewIndex = refs.current
      .map(({ prevWindowItem }) => prevWindowItem)
      .findIndex((i) => hasTag(i, flexibleView))
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

    //TODO: fix container's width/height  /or should?????, not you shouldn't, just fixed height in example
    // TODO: expand line hoverable area
    // TODO: extract main feature to hook, for easier managements
  }, [])
  //#endregion

  //#region ------------------- feature: auto resize base on wrapper's content React -------------------
  const wrapperRef = useRef<HTMLElement>(null)
  const wrapperInitHeight = useRef(0)
  const wrapperInitWidth = useRef(0)

  // load init size of wrapper
  useEffect(() => {
    assert(wrapperRef.current, `SplitView's is not loaded succefully`)
    wrapperInitWidth.current = wrapperRef.current.clientWidth
    wrapperInitHeight.current = wrapperRef.current.clientHeight
  }, [])

  // resize views base on wrapper's size, to ensure proportion stable(eaqual between )
  useResizeObserver(wrapperRef, (entry, prevEntry) => {
    if (!refs.current.length) return // wrapper is not load yet
    const flexibleViewIndex = getFlexibleIndex()
    const prevWidth = prevEntry?.contentRect.width ?? wrapperInitWidth.current
    const prevHeight = prevEntry?.contentRect.height ?? wrapperInitHeight.current
    assert(prevWidth != null, `init width not detected`)
    assert(prevHeight != null, `init height not detected`)
    const widthDeltaPercent = entry.contentRect.width / prevWidth
    const heightDeltaPercent = entry.contentRect.height / prevHeight
    const allViews = refs.current.map((i) => i.prevWindowItem)
    allViews.forEach((view, idx) => {
      if (idx !== flexibleViewIndex) {
        dir === 'row'
          ? setInlineStyle(view, 'width', (w) => (w ? Number.parseFloat(w) : view.clientWidth) * widthDeltaPercent)
          : setInlineStyle(view, 'height', (h) => (h ? Number.parseInt(h) : view.clientHeight) * heightDeltaPercent)
      }
    })
  })
  //#endregion

  const Wrapper = dir === 'row' ? Row : Col
  return (
    <Wrapper {...props} icss={[{ height: '100%', width: '100%' }, props.icss]} domRef={[wrapperRef, props.domRef]}>
      {mapElementChildren(props.children, (childNode, idx) => (
        <Fragment key={idx}>
          {/*  Window  */}
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
          {/* line */}
          <Div
            domRef_={(el) => (refs.current[idx] = { ...refs.current[idx], line: el })}
            icss_={[
              {
                ':last-child': {
                  display: 'none'
                }, // TODO: should not render this DOM

                flex: 'none',
                backgroundColor: '#ec123c91',
                ':hover': { backgroundColor: 'dodgerblue' },
                transition: '75ms'
              },
              dir === 'row' ? { width: 4, cursor: 'e-resize' } : { height: 4, cursor: 'n-resize' }
            ]}
            {...lineProps}
          ></Div>
        </Fragment>
      ))}
    </Wrapper>
  )
}

const flexibleView = createDataTag({ key: 'RowSplit', value: 'container-flexible' })
SplitView.flexibleView = flexibleView
