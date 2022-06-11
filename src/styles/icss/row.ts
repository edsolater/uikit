import { isObject, isString, isUndefined } from '@edsolater/fnkit/dist-old'
import { createICSS, ICSS, ICSSObject } from '../parseCSS'

type ICSSRowPresetAlign = `align-${'baseline' | 'normal' | 'stretch' | 'center' | 'end' | 'start'}`
type ICSSRowPresetJustify = `justify-${
  | 'space-around'
  | 'space-between'
  | 'space-evenly'
  | 'stretch'
  | 'center'
  | 'end'
  | 'start'}`
type ICSSRowPresetName =
  | 'center'
  | ICSSRowPresetAlign
  | ICSSRowPresetJustify
  | `${ICSSRowPresetJustify} ${ICSSRowPresetAlign}`
  | `${ICSSRowPresetAlign} ${ICSSRowPresetJustify}`
type ICSSRowObjectParam = {
  gap?: ICSSObject['gap']
  justify?: ICSSObject['justifyContent']
  justifyItems?: ICSSObject['justifyItems']
  content?: ICSSObject['alignContent']
  items?: ICSSObject['alignItems']
}

export function icssRow(options?: ICSSRowObjectParam): ICSS
export function icssRow(preset: ICSSRowPresetName): ICSS
export function icssRow(opt: ICSSRowObjectParam | ICSSRowPresetName = {}): ICSS {
  if (isObject(opt)) {
    return {
      display: 'flex',
      gap: opt.gap,
      justifyContent: opt.justify,
      justifyItems: opt.justifyItems,
      alignContent: opt.content,
      alignItems: opt.items
    }
  }
  if (isString(opt)) {
    const icssCollection = { display: 'flex' } as ICSSObject
    if (opt.includes('center')) {
      icssCollection.justifyContent = 'center' as ICSSObject['justifyContent']
      icssCollection.alignItems = 'center' as ICSSObject['alignItems']
    }

    if (opt.includes('align-baseline')) {
      icssCollection.alignItems = 'baseline' as ICSSObject['alignItems']
    }
    if (opt.includes('align-normal')) {
      icssCollection.alignItems = 'normal' as ICSSObject['alignItems']
    }
    if (opt.includes('align-stretch')) {
      icssCollection.alignItems = 'stretch' as ICSSObject['alignItems']
    }
    if (opt.includes('align-center')) {
      icssCollection.alignItems = 'center' as ICSSObject['alignItems']
    }
    if (opt.includes('align-end')) {
      icssCollection.alignItems = 'end' as ICSSObject['alignItems']
    }
    if (opt.includes('align-start')) {
      icssCollection.alignItems = 'start' as ICSSObject['alignItems']
    }

    if (opt.includes('justify-space-between')) {
      icssCollection.justifyContent = 'space-between' as ICSSObject['justifyContent']
    }
    if (opt.includes('justify-space-around')) {
      icssCollection.justifyContent = 'space-around' as ICSSObject['justifyContent']
    }
    if (opt.includes('justify-evenly')) {
      icssCollection.justifyContent = 'space-evenly' as ICSSObject['justifyContent']
    }
    if (opt.includes('justify-stretch')) {
      icssCollection.justifyContent = 'stretch' as ICSSObject['justifyContent']
    }
    if (opt.includes('justify-center')) {
      icssCollection.justifyContent = 'center' as ICSSObject['justifyContent']
    }
    if (opt.includes('justify-end')) {
      icssCollection.justifyContent = 'end' as ICSSObject['justifyContent']
    }
    if (opt.includes('justify-start')) {
      icssCollection.justifyContent = 'start' as ICSSObject['justifyContent']
    }
    return icssCollection
  }
}
