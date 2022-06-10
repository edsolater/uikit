import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createDate,
  eq,
  filter,
  findKey,
  getCalendarDate,
  getDayOfWeek,
  getMonth,
  getMonthLength,
  getYear,
  groupBy,
  map,
  max,
  notNullish,
  offsetDateTime,
  setDate
} from '@edsolater/fnkit'
import { setInlineStyle } from '../../functions/dom/setCSS'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { useScrollCallbackRef } from '../../hooks/useScrollDetectorRef'
import { Div } from '..'
import {
  cssCalendarGrid,
  cssCalendarItem,
  cssCalendarItemActive,
  cssCalendarItemFriday,
  cssCalendarItemMonday,
  cssCalendarItemMute,
  cssCalendarItemSaturday,
  cssCalendarItemSunday,
  cssCalendarItemThursday,
  cssCalendarItemTuesday,
  cssCalendarItemWednesday
} from './DatePicker.css'
import { DivProps } from '../Div'
import Grid from '../Grid'
import { scrollIntoView } from '../../functions/dom/scrollIntoView'
import { useDatePickerStore } from './DatePicker'
import { useRecordedEffect } from '../../hooks/useRecordedEffect'
import { icssScrollOverflow, icssNoScrollbar, icssSelectable, icssSelected } from '../../styles'

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

function genAMonthDateArray(payload?: {
  targetYear?: number
  /** base 1, can be -11 ~ 24  */
  targetMonth?: number
}): DateItemInfo[] {
  const targetYear = payload?.targetYear ?? getYear()
  const targetMonth = payload?.targetMonth ?? getMonth()
  const { parsedYear, parsedMonth } =
    targetMonth < 1
      ? { parsedYear: targetYear - 1, parsedMonth: 12 + targetMonth }
      : targetMonth > 12
      ? { parsedYear: targetYear + 1, parsedMonth: targetMonth - 12 }
      : { parsedYear: targetYear, parsedMonth: targetMonth }

  const currentMonthFirstDayDateTime = createDate(parsedYear, parsedMonth, 1)
  const currentMonthLength = getMonthLength(
    getYear(currentMonthFirstDayDateTime),
    getMonth(currentMonthFirstDayDateTime)
  )
  const todayDateTime = createDate()

  return Array.from({ length: currentMonthLength }, (_, index) => {
    const currentItemDateTime = offsetDateTime(currentMonthFirstDayDateTime, index, { unit: 'days' })
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
export function CalendarDateBody({ componentRef, ...divProps }: DivProps & { componentRef?: never }) {
  const { currentDateTime, setCurrentDateTime } = useDatePickerStore('currentDateTime')

  const currentYear = getYear(currentDateTime)
  const currentMonth = getMonth(currentDateTime)
  const currentCalendarDate = getCalendarDate(currentDateTime)

  // useMemo to avoid generate a new array every time `currentMonth` changed
  const currentMonthArray = useMemo(
    () => genAMonthDateArray({ targetYear: getYear(currentDateTime), targetMonth: getMonth(currentDateTime) }),
    []
  )
  const nextMonthArraySets = genNextMonthDateArraySets(currentMonthArray[currentMonthArray.length - 1])
  const prevMonthArraySets = genPrevMonthDateArraySets(currentMonthArray[0])
  const [calendarDateArray, setCalendarDateArray] = useState([
    ...(prevMonthArraySets ?? []),
    currentMonthArray,
    ...(nextMonthArraySets ?? [])
  ])

  const calendarItemDoms = useRef<{ [dateString: string]: DateCalendarItemInfo }>({})
  const calendarBoxDom = useRef<HTMLElement>(null)

  const [lockUpdateReactStateFlag, setLockUpdateReactStateFlag] = useState(false) // it will be on when DOM is transition

  async function scrollToCurrent() {
    const targetFirstCalendarDateInfo = Object.values(calendarItemDoms.current).find(
      (info) => info.year === getYear(currentDateTime) && info.month === getMonth(currentDateTime)
    )
    if (!targetFirstCalendarDateInfo?.el) return Promise.resolve(undefined) // TODO: what if haven't generate corresponding target month

    setLockUpdateReactStateFlag(true) // when DOM  transition, React should not  state update, for React will break transition
    await scrollIntoView(targetFirstCalendarDateInfo.el)
    setLockUpdateReactStateFlag(false)
  }

  const isScrollForPropsChanges = useRef(false) // if not scroll by user action, but props change, onScroll callback(getMostVisiable()) should not be fired

  // scroll when sclecet month
  useRecordedEffect(
    ([prevRenderYear, prevRenderMonther]) => {
      // the same , no need to scroll
      if (prevRenderYear === currentYear && prevRenderMonther === currentMonth) return
      // havn't init yet
      if (!prevRenderYear || !prevRenderMonther) return
      const [uiMostYear, uiMostMonth] = getMostVisiable(Object.values(calendarItemDoms.current)) ?? []

      // ui is right , no need scroll to focus current most month
      if (currentMonth === uiMostMonth && currentYear === uiMostYear) return

      isScrollForPropsChanges.current = true // tell code not to be aware of onScroll
      scrollToCurrent().then(() => {
        isScrollForPropsChanges.current = false
      })
    },
    [currentYear, currentMonth]
  )

  function genNextMonthDateArraySets(
    lastDayofMonth = calendarDateArray[calendarDateArray.length - 1]?.[
      calendarDateArray[calendarDateArray.length - 1].length - 1
    ]
  ) {
    if (!lastDayofMonth) return
    const nextMonthFirstDay = offsetDateTime(lastDayofMonth.date, 1, { unit: 'days' })
    const nextMonth = genAMonthDateArray({
      targetYear: getYear(nextMonthFirstDay),
      targetMonth: getMonth(nextMonthFirstDay)
    })
    const nextNextMonthFirstDay = offsetDateTime(nextMonthFirstDay, 1, { unit: 'months' })
    const nextNextMonth = genAMonthDateArray({
      targetYear: getYear(nextNextMonthFirstDay),
      targetMonth: getMonth(nextNextMonthFirstDay)
    })
    const nextNextNextMonthFirstDay = offsetDateTime(nextNextMonthFirstDay, 1, { unit: 'months' })
    const nextNextNextMonth = genAMonthDateArray({
      targetYear: getYear(nextNextNextMonthFirstDay),
      targetMonth: getMonth(nextNextNextMonthFirstDay)
    })

    return [nextMonth, nextNextMonth, nextNextNextMonth]
  }

  function genPrevMonthDateArraySets(firstDayofMonth = calendarDateArray[0]?.[0]) {
    if (!firstDayofMonth) return
    const prevMonthFirstDay = offsetDateTime(firstDayofMonth.date, -1, { unit: 'days' })
    const prevMonth = genAMonthDateArray({
      targetYear: getYear(prevMonthFirstDay),
      targetMonth: getMonth(prevMonthFirstDay)
    })
    const prevPrevMonthFirstDay = offsetDateTime(prevMonthFirstDay, -1, { unit: 'months' })
    const prevPrevMonth = genAMonthDateArray({
      targetYear: getYear(prevPrevMonthFirstDay),
      targetMonth: getMonth(prevPrevMonthFirstDay)
    })
    const prevPrevPrevMonthFirstDay = offsetDateTime(prevPrevMonthFirstDay, -1, { unit: 'months' })
    const prevPrevPrevMonth = genAMonthDateArray({
      targetYear: getYear(prevPrevPrevMonthFirstDay),
      targetMonth: getMonth(prevPrevPrevMonthFirstDay)
    })

    return [prevPrevPrevMonth, prevPrevMonth, prevMonth]
  }

  function getMostVisiable(dataItems: DateCalendarItemInfo[]): [year: number, month: number] | undefined {
    const visiableItems = filter(dataItems, (i) => i.visiable)
    if (!visiableItems.length) return

    const groupResult = groupBy(visiableItems, (i) => `${i.year}-${i.month}`)
    const groupResultCount = map(groupResult, (list) => list?.length ?? 0)
    const mostLength = max(Object.values(groupResultCount))
    const key = findKey(groupResult, (list) => list?.length === mostLength)
    return key?.split('-').map((i) => Number(i)) as [year: number, month: number]
  }

  const scrollCallbackRef = useScrollCallbackRef({
    lock: lockUpdateReactStateFlag,
    nearlyMargin: '120%',
    onNearlyScrollBottom: () => {
      const nextArraySets = genNextMonthDateArraySets()
      setCalendarDateArray((prev) => [...prev, ...(nextArraySets ?? [])])
    },
    onNearlyScrollTop: () => {
      const prevArraySets = genPrevMonthDateArraySets()
      setCalendarDateArray((prev) => [...(prevArraySets ?? []), ...prev])
    },
    onScroll: () => {
      if (isScrollForPropsChanges.current) return // no need to be aware of onScroll
      const [mostYear, mostMounth] = getMostVisiable(Object.values(calendarItemDoms.current)) ?? []
      if (notNullish(mostMounth) && notNullish(mostYear)) {
        const newDate = setDate(currentDateTime, { month: mostMounth, year: mostYear })
        const monthHasChange = !eq(getMonth(currentDateTime), mostMounth)
        const yearHasChange = !eq(getYear(currentDateTime), currentYear)
        // TODO scrollInToView() should ban fellowing code
        if (monthHasChange || yearHasChange) {
          setCurrentDateTime(newDate)
        }
      }
    }
  })

  const { rootDom: intersectionObserverRootDom, childDomSpawner: intersectionObserverChildDomSpawner } =
    useIntersectionObserver()

  useEffect(() => {
    const calendarItemHeight = Object.values(calendarItemDoms.current)?.[0]?.el.clientHeight ?? 0
    const calendarLineCount = 5
    setInlineStyle(calendarBoxDom.current, 'height', `${calendarItemHeight * calendarLineCount}px`)

    const selectedMonthFirstDay = calendarItemDoms.current[`${currentYear}-${currentMonth}-1`]?.el
    selectedMonthFirstDay?.scrollIntoView()
  }, [])

  return (
    <Grid
      {...divProps}
      domRef={[calendarBoxDom, scrollCallbackRef, intersectionObserverRootDom]}
      className={cssCalendarGrid}
      icss={[icssNoScrollbar, icssScrollOverflow({ cssValue: 'auto' }), { position: 'relative' }]}
    >
      {calendarDateArray.flat().map((info) => {
        const isCurrent =
          info.year === currentYear && info.month === currentMonth && info.calendarDate === currentCalendarDate
        return (
          <Div
            key={`${info.year}-${info.month}-${info.calendarDate}`}
            domRef={[
              (el) => {
                const key = `${getYear(info.date)}-${getMonth(info.date)}-${getCalendarDate(info.date)}`
                calendarItemDoms.current[key] = { el, ...info }
              },
              intersectionObserverChildDomSpawner.spawnRefCallback({
                observeCallback: (entry) => {
                  const key = `${getYear(info.date)}-${getMonth(info.date)}-${getCalendarDate(info.date)}`
                  calendarItemDoms.current[key] = { ...calendarItemDoms.current[key]!, visiable: entry.isIntersecting }
                }
              })
            ]}
            className={[
              cssCalendarItem,
              info.isToday && cssCalendarItemActive,
              (info.month !== currentMonth || info.year !== currentYear) && cssCalendarItemMute,
              info.dayOfWeek === 0 && cssCalendarItemSunday,
              info.dayOfWeek === 1 && cssCalendarItemMonday,
              info.dayOfWeek === 2 && cssCalendarItemTuesday,
              info.dayOfWeek === 3 && cssCalendarItemWednesday,
              info.dayOfWeek === 4 && cssCalendarItemThursday,
              info.dayOfWeek === 5 && cssCalendarItemFriday,
              info.dayOfWeek === 6 && cssCalendarItemSaturday
            ]}
            icss={[
              {
                padding: 12,
                aspectRatio: '1/1',
                transition: 'opacity 500ms',
                borderRadius: 2
              },
              icssSelectable,
              isCurrent && icssSelected
            ]}
            onClick={() => {
              setCurrentDateTime((dateTime) =>
                setDate(dateTime, { year: info.year, month: info.month, calendarDate: info.calendarDate })
              )
            }}
          >
            {info.calendarDate}
          </Div>
        )
      })}
    </Grid>
  )
}
