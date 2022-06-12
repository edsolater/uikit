import { isObject, isString, isUndefined } from '@edsolater/fnkit'
import { cssColors } from '../cssValues'
import { ICSSObject, ICSS } from '../parseCSS'

type ICSSTextPresetName = 'label' | 'secondary-label'
type ICSSTextObjectParam = {
  fontWeight?: ICSSObject['fontWeight']
  fontSize?: ICSSObject['fontSize']
  color?: ICSSObject['color']
}

export function icssText(options?: ICSSTextObjectParam): ICSS
export function icssText(preset: ICSSTextPresetName): ICSS
export function icssText(opt?: ICSSTextObjectParam | ICSSTextPresetName): ICSS {
  if (isUndefined(opt)) return {}
  if (isObject(opt)) {
    // opt may not only include fontWeight, fontSize, color, so return opt directly may cause bug
    return {
      fontweight: opt.fontWeight,
      fontSize: opt.fontWeight,
      color: opt.color
    }
  }
  if (isString(opt)) {
    const icssResult = {} as ICSSObject
    if (opt.includes('label')) {
      icssResult.color = cssColors.labelColor
      icssResult.fontSize = '14px'
    }
    if (opt.includes('secondary-label')) {
      icssResult.color = cssColors.secondaryLabelColor
      icssResult.fontSize = '13px'
    }
    return icssResult
  }
}
