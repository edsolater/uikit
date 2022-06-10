import {
  createDate,
  formatDate,
  getMonth,
  getYear,
  isSameDate,
  mapToEnglishFullMonth,
  offsetDateTime,
  toKebabCase
} from '@edsolater/fnkit'

import { createContextStore } from '../../functions/react/createContextStore'
import { Button, Div } from '..'
import { DivProps } from '../Div'
import Row from '../Row'
import { TimePicker } from './TimePicker'
import { CalendarDateBody } from './CalendarDateBody'
import { CalendarMonthBody } from './CalendarMonthBody'
import Col from '../Col'
import { useEffect } from 'react'
import { icssClickable } from '../../styles'

export interface DatePickerProps extends DivProps {
  value?: Date
  onChange?: (value: Date) => void
}

export const {
  ContextProvider: DatePickerContextProvider,
  useStore: useDatePickerStore,
  useStoreSetters: useDatePickerStoreSetters,
  getStoreState: getDatePickerStoreState
} = createContextStore({
  now: createDate(),
  currentDateTime: createDate(),
  timeMode: 'utc' as 'local' | 'utc',
  isMonthPickerOn: false,
  isYearPickerOn: false
})

export default function DatePicker(props: DatePickerProps) {
  return (
    <DatePickerContextProvider>
      <DatePickerLayout {...props} />
    </DatePickerContextProvider>
  )
}

function DatePickerLayout(props: DatePickerProps) {
  // TODO: use grid
  return (
    <Col icss={{ gap: 8 }}>
      <DatePickerInnerStateIllustrator {...props} />
      <Row className='gap-4'>
        <div>
          <Row icss={{ gap: 16, justifyContent: 'space-between', marginBottom: 8 }}>
            <DatePickerYearMonthIndicator />
            <DatePickerCalendarController />
          </Row>
          <CalendarPickers />
        </div>
        <TimePicker />
      </Row>
    </Col>
  )
}

function DatePickerInnerStateIllustrator(props: Pick<DatePickerProps, 'value' | 'onChange'>) {
  const { currentDateTime, setCurrentDateTime } = useDatePickerStore()
  if (props.value && !isSameDate(currentDateTime, props.value)) setCurrentDateTime(props.value)
  useEffect(() => {
    props.onChange?.(currentDateTime)
  }, [currentDateTime])
  return <Div icss={{ fontSize: '2em', textAlign: 'center' }}>{formatDate(currentDateTime, 'YYYY-MM-DD HH:mm:ss')}</Div>
}

function DatePickerYearMonthIndicator() {
  const { setIsMonthPickerOn } = useDatePickerStoreSetters()
  const { currentDateTime } = useDatePickerStore()
  const currentYear = getYear(currentDateTime)
  const currentMonth = getMonth(currentDateTime)
  return (
    <Row
      onClick={() => {
        setIsMonthPickerOn(true)
      }}
      icss={{ gap: 8 }}
    >
      <Div>{currentYear}</Div>
      <Div>{mapToEnglishFullMonth(currentMonth)}</Div>
    </Row>
  )
}

function CalendarPickers() {
  const { isMonthPickerOn } = useDatePickerStore('isMonthPickerOn')
  return (
    <Div
      className={`${toKebabCase(DatePicker.name)}__${toKebabCase(CalendarPickers.name)}`}
      icss={[{ position: 'relative', perspective: 600, perspectiveOrigin: '50% 50%' }]}
    >
      {isMonthPickerOn && <CalendarMonthBody icss={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }} />}
      <CalendarDateBody icss={{ transform: 'translateZ(-40px)', transformStyle: 'preserve-3d' }} />
    </Div>
  )
}

function DatePickerCalendarController() {
  const { isMonthPickerOn } = useDatePickerStore('isMonthPickerOn')
  const { currentDateTime, setCurrentDateTime } = useDatePickerStore('currentDateTime')
  return (
    <Row icss={{ gap: 8 }}>
      <Button
        variant='text'
        className={icssClickable}
        icss={{ fontSize: '1.5em' }}
        onClick={() => {
          if (isMonthPickerOn) {
            setCurrentDateTime(offsetDateTime(currentDateTime, -1, { unit: 'years' }))
          } else {
            setCurrentDateTime(offsetDateTime(currentDateTime, -1, { unit: 'months' }))
          }
        }}
      >
        ▲
      </Button>
      <Button
        variant='text'
        className={icssClickable}
        icss={{ fontSize: '1.5em' }}
        onClick={() => {
          if (isMonthPickerOn) {
            setCurrentDateTime(offsetDateTime(currentDateTime, 1, { unit: 'years' }))
          } else {
            setCurrentDateTime(offsetDateTime(currentDateTime, 1, { unit: 'months' }))
          }
        }}
      >
        ▼
      </Button>
    </Row>
  )
}
