import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import {
  createDate,
  eq,
  filter,
  findKey,
  getCalendarDate,
  getDayOfWeek,
  getMonth,
  getYear,
  groupBy,
  map,
  mapToEnglishFullMonth,
  max,
  notNullish,
  offsetDateTime,
  setDate} from '@edsolater/fnkit'
import { setInlineStyle } from '../../functions/dom/setCSS'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { useScrollCallbackRef } from '../../hooks/useScrollDetectorRef'
import { Div } from '..'
import {
  cssCalendarItemActive,
  cssCalendarItemMute,
  cssCalendarMonthGrid
} from './DatePicker.css'
import { DivProps } from '../Div'
import Grid from '../Grid'
import { scrollIntoView } from '../../functions/dom/scrollIntoView'
import { useDatePickerStore, useDatePickerStoreSetters } from './DatePicker'
import { icssClickable, icssNoScrollbar, icssScrollOverflow } from '../../styles'

type DateItemInfo = {
  isToday: boolean
  date: Date
  year: number
  month: number
  calendarDate: number
  dayOfWeek: number
  monthFirstDayDateTime: Date
}

type DateCalendarItemInfo = DateItemInfo & {
  el: HTMLElement
  visiable?: boolean
}

export type CalendarMonthBodyHandler = {
  scrollToNextYearMonthCalendar: () => void
  scrollToPrevYearMonthCalendar: () => void
}

function genAYearMonthArray(payload?: { targetYear?: number }): DateItemInfo[] {
  const targetYear = payload?.targetYear ?? getYear()

  const currentMonthFirstDayDateTime = createDate(targetYear, 1, 1)
  const todayDateTime = createDate()

  return Array.from({ length: 12 }, (_, index) => {
    const currentItemDateTime = offsetDateTime(currentMonthFirstDayDateTime, index, { unit: 'months' })
    const currentItemYear = getYear(currentItemDateTime)
    const currentItemMonth = getMonth(currentItemDateTime)
    const currentItemDate = getCalendarDate(currentItemDateTime)
    const currentItemDay = getDayOfWeek(currentItemDateTime)
    const todayYear = getYear(todayDateTime)
    const todayMonth = getMonth(todayDateTime)
    const todayDate = getCalendarDate(todayDateTime)
    return {
      isToday: currentItemDate === todayDate && currentItemMonth === todayMonth && currentItemYear === todayYear,
      date: currentItemDateTime,
      year: currentItemYear,
      month: currentItemMonth,
      calendarDate: currentItemDate,
      dayOfWeek: currentItemDay,
      monthFirstDayDateTime: currentMonthFirstDayDateTime
    } as DateItemInfo
  })
}
export function CalendarMonthBody({
  componentRef,
  ...divProps
}: DivProps & { componentRef?: MutableRefObject<CalendarMonthBodyHandler> }) {
  const { currentDateTime } = useDatePickerStore('currentDateTime')
  const { setIsMonthPickerOn, setCurrentDateTime } = useDatePickerStoreSetters()

  const currentYear = getYear(currentDateTime)
  const currentMonth = getMonth(currentDateTime)

  // useMemo to avoid generate a new array every time `currentMonth` changed
  const currentYearMonthArray = useMemo(() => genAYearMonthArray({ targetYear: getYear(currentDateTime) }), [])
  const nextYearMonthArraySets = genNextYearMonthArraySets(currentYearMonthArray[currentYearMonthArray.length - 1])
  const prevYearMonthArraySets = genPrevYearMonthArraySets(currentYearMonthArray[0])
  const [calendarMonthArray, setCalendarMonthArray] = useState([
    ...(prevYearMonthArraySets ?? []),
    currentYearMonthArray,
    ...(nextYearMonthArraySets ?? [])
  ])

  const calendarItemDoms = useRef<{ [dateString: string]: DateCalendarItemInfo }>({})
  const calendarBoxDom = useRef<HTMLElement>(null)

  const [lockUpdateReactStateFlag, setLockUpdateReactStateFlag] = useState(false) // it will be on when DOM is transition

  // scroll to month smoothly
  function scrollToYear(offsetYearNumber: number) {
    const targetYearFirstMonthDateTime = offsetDateTime(setDate(currentDateTime, { month: 1 }), offsetYearNumber, {
      unit: 'years'
    })

    const targetYearFirstMonthInfo = Object.values(calendarItemDoms.current).find(
      (info) => info.year === getYear(targetYearFirstMonthDateTime)
    )

    if (!targetYearFirstMonthInfo?.el) return

    setLockUpdateReactStateFlag(true) // when DOM  transition, React should not  state update, for React will break transition
    scrollIntoView(targetYearFirstMonthInfo.el).then(() => {
      setLockUpdateReactStateFlag(false)
    })
  }

  function genNextYearMonthArraySets(
    lastMonthOfYear = calendarMonthArray[calendarMonthArray.length - 1]?.[
      calendarMonthArray[calendarMonthArray.length - 1].length - 1
    ]
  ) {
    if (!lastMonthOfYear) return
    const nextYearFirstMonth = offsetDateTime(lastMonthOfYear.date, 1, { unit: 'months' })
    const nextYear = genAYearMonthArray({
      targetYear: getYear(nextYearFirstMonth)
    })
    const nextNextYearFirstMonth = offsetDateTime(nextYearFirstMonth, 1, { unit: 'years' })
    const nextNextYear = genAYearMonthArray({
      targetYear: getYear(nextNextYearFirstMonth)
    })
    const nextNextNextYearFirstMonth = offsetDateTime(nextNextYearFirstMonth, 1, { unit: 'years' })
    const nextNextNextYear = genAYearMonthArray({
      targetYear: getYear(nextNextNextYearFirstMonth)
    })

    return [nextYear, nextNextYear, nextNextNextYear]
  }

  function genPrevYearMonthArraySets(firstMonthOfYear = calendarMonthArray[0]?.[0]) {
    if (!firstMonthOfYear) return
    const prevYearFirstMonth = offsetDateTime(firstMonthOfYear.date, -1, { unit: 'months' })
    const prevYear = genAYearMonthArray({
      targetYear: getYear(prevYearFirstMonth)
    })
    const prevPrevYearFirstMonth = offsetDateTime(prevYearFirstMonth, -1, { unit: 'years' })
    const prevPrevYear = genAYearMonthArray({
      targetYear: getYear(prevPrevYearFirstMonth)
    })
    const prevPrevPrevYearFirstMonth = offsetDateTime(prevPrevYearFirstMonth, -1, { unit: 'years' })
    const prevPrevPrevYear = genAYearMonthArray({
      targetYear: getYear(prevPrevPrevYearFirstMonth)
    })

    return [prevPrevPrevYear, prevPrevYear, prevYear]
  }

  function getMostVisiable(dataItems: DateCalendarItemInfo[]): [year: string] | undefined {
    const visiableItems = filter(dataItems, (i) => i.visiable)
    if (!visiableItems.length) return

    const groupResult = groupBy(visiableItems, (i) => `${i.year}`)
    const groupResultCount = map(groupResult, (list) => list?.length ?? 0)
    const mostLength = max(Object.values(groupResultCount))
    // @ts-expect-error split is not type complete
    return findKey(groupResult, (list) => list?.length === mostLength)?.split(' ')
  }

  const scrollDetector = useScrollCallbackRef({
    lock: lockUpdateReactStateFlag,
    nearlyMargin: '120%',
    onNearlyScrollBottom: () => {
      const nextArraySets = genNextYearMonthArraySets()
      setCalendarMonthArray((prev) => [...prev, ...(nextArraySets ?? [])])
    },
    onNearlyScrollTop: () => {
      const prevArraySets = genPrevYearMonthArraySets()
      setCalendarMonthArray((prev) => [...(prevArraySets ?? []), ...prev])
    },
    onScroll: () => {
      const [mostYear] = getMostVisiable(Object.values(calendarItemDoms.current)) ?? []
      if (notNullish(mostYear)) {
        const newDate = setDate(currentDateTime, { year: mostYear })
        const yearHasChange = !eq(getYear(currentDateTime), currentYear)
        // TODO scrollInToView() should ban fellowing code
        if (yearHasChange) {
          setCurrentDateTime(newDate)
        }
      }
    }
  })

  const { rootDom: intersectionObserverRootDom, childDomSpawner: intersectionObserverChildDomSpawner } =
    useIntersectionObserver()

  useEffect(() => {
    const calendarItemHeight = Object.values(calendarItemDoms.current)[0]?.el.clientHeight ?? 0
    const calendarLineCount = 5
    setInlineStyle(calendarBoxDom.current, 'height', `${calendarItemHeight * calendarLineCount}px`)

    const selectedYearFirstMonth = calendarItemDoms.current[`${currentYear}-1-1`]?.el
    selectedYearFirstMonth?.scrollIntoView()
  }, [])

  return (
    <Grid
      {...divProps}
      domRef={[calendarBoxDom, scrollDetector, intersectionObserverRootDom]}
      className={cssCalendarMonthGrid}
      icss={[
        divProps.icss,
        icssNoScrollbar,
        icssScrollOverflow({ cssValue: 'auto' }),
        { position: 'absolute', backdropFilter: 'blur(8px)', inset: 0, zIndex: 1 }
      ]}
    >
      {calendarMonthArray.flat().map((info) => (
        <Div
          key={`${info.year}-${info.month}`}
          domRef={[
            (el) => {
              const key = `${getYear(info.date)}-${getMonth(info.date)}`
              calendarItemDoms.current[key] = { el, ...info }
            },
            intersectionObserverChildDomSpawner.spawnRefCallback({
              observeCallback: (entry) => {
                const key = `${getYear(info.date)}-${getMonth(info.date)}`
                calendarItemDoms.current[key] = { ...calendarItemDoms.current[key]!, visiable: entry.isIntersecting }
              }
            })
          ]}
          className={[
            info.isToday && cssCalendarItemActive,
            (info.month !== currentMonth || info.year !== currentYear) && cssCalendarItemMute
          ]}
          icss={[
            {
              padding: 12,
              transition: '500ms'
            },
            {
              display: 'grid',
              placeItems: 'center'
            },
            icssClickable
          ]}
          onClick={() => {
            setIsMonthPickerOn(false)
            setCurrentDateTime((dateTime) => setDate(dateTime, { year: info.year, month: info.month }))
          }}
        >
          {mapToEnglishFullMonth(info.month)}
        </Div>
      ))}
    </Grid>
  )
}
