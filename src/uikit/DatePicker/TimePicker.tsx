import { getHours, getMinutes, getSeconds, setDate } from '@edsolater/fnkit'
import { useMemo, useState } from 'react'
import { ICSS } from '../../styles/parseCSS'

import { Div, Row } from '..'
import Col from '../Col'
import CycleScroll from '../CycleScroll'
import { useDatePickerStore } from './DatePicker'
import { icssSelectable, icssSelected } from '../../styles'

const availableHours = Array.from({ length: 24 }, (_, idx) => idx)
const availableMinutes = Array.from({ length: 60 }, (_, idx) => idx)
const availableSeconds = Array.from({ length: 60 }, (_, idx) => idx)

const ItemStyle: ICSS = {
  paddingBlock: 8,
  paddingInline: 24,
  ...icssSelectable,
  borderRadius: 2
}

function HourPicker() {
  const { currentDateTime, setCurrentDateTime } = useDatePickerStore('currentDateTime')
  const { now } = useDatePickerStore('now')
  const currentHour = getHours(currentDateTime)
  const nowHour = getHours(now)

  const [currentSelectedIndex, setCurrentSelectedIndex] = useState<number>()

  const hourItems = useMemo(
    () =>
      availableHours.map((hour, idx) => {
        const isCurrent = hour === currentHour
        const isNow = hour === nowHour
        if (isNow && currentSelectedIndex == null) setCurrentSelectedIndex(idx)
        return (
          <Div
            key={String(hour)}
            icss={[ItemStyle, isCurrent && icssSelected]}
            onClick={() => {
              setCurrentDateTime((oldDateTime) => setDate(oldDateTime, { hours: hour }))
              setCurrentSelectedIndex(idx)
            }}
          >
            {String(hour).padStart(2, '0')}
          </Div>
        )
      }),
    [currentHour, nowHour]
  )
  return (
    <Col>
      <Div icss={{ textAlign: 'center', fontSize: '.8em' }}>hour</Div>
      <CycleScroll icss={{ flexGrow: 1 }} items={hourItems} selectedIndex={currentSelectedIndex} />
    </Col>
  )
}

function MinutePicker() {
  const { currentDateTime, setCurrentDateTime } = useDatePickerStore('currentDateTime')
  const { now } = useDatePickerStore('now')
  const currentMinute = getMinutes(currentDateTime)
  const nowMinute = getMinutes(now)

  const [currentSelectedIndex, setCurrentSelectedIndex] = useState<number>()

  const minuteItems = useMemo(
    () =>
      availableMinutes.map((minute, idx) => {
        const isCurrent = minute === currentMinute
        const isNow = minute === nowMinute
        if (isNow && currentSelectedIndex == null) setCurrentSelectedIndex(idx)
        return (
          <Div
            key={String(minute)}
            icss={[ItemStyle, isCurrent && icssSelected]}
            onClick={() => {
              setCurrentDateTime((oldDateTime) => setDate(oldDateTime, { minutes: minute }))
              setCurrentSelectedIndex(idx)
            }}
          >
            {String(minute).padStart(2, '0')}
          </Div>
        )
      }),
    [currentMinute, nowMinute]
  )
  return (
    <Col>
      <Div icss={{ textAlign: 'center', fontSize: '.8em' }}>minute</Div>
      <CycleScroll icss={{ flexGrow: 1 }} items={minuteItems} selectedIndex={currentSelectedIndex} />
    </Col>
  )
}
function SecondPicker() {
  const { currentDateTime, setCurrentDateTime } = useDatePickerStore('currentDateTime')
  const { now } = useDatePickerStore('now')
  const currentSecond = getSeconds(currentDateTime)
  const nowSecond = getSeconds(now)

  const [currentSelectedIndex, setCurrentSelectedIndex] = useState<number>()

  const secondItems = useMemo(
    () =>
      availableSeconds.map((second, idx) => {
        const isCurrent = second === currentSecond
        const isNow = second === nowSecond
        if (isNow && currentSelectedIndex == null) setCurrentSelectedIndex(idx)
        return (
          <Div
            key={String(second)}
            icss={[ItemStyle, isCurrent && icssSelected]}
            onClick={() => {
              setCurrentDateTime((oldDateTime) => setDate(oldDateTime, { seconds: second }))
              setCurrentSelectedIndex(idx)
            }}
          >
            {String(second).padStart(2, '0')}
          </Div>
        )
      }),
    [currentSecond, nowSecond]
  )
  return (
    <Col>
      <Div icss={{ textAlign: 'center', fontSize: '.8em' }}>second</Div>
      <CycleScroll icss={{ flexGrow: 1 }} items={secondItems} selectedIndex={currentSelectedIndex} />
    </Col>
  )
}

export function TimePicker() {
  return (
    <Row className='gap-2'>
      <HourPicker />
      <MinutePicker />
      <SecondPicker />
    </Row>
  )
}
