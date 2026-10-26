/**
 * 字形选择的属性目标。
 *
 * 选择字体、字号、字重及字形变体/合成/可变字体轴，以确定实际使用的字形。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $font = key('font')

export const $fontFamily = key('font-family')

export const $fontFeatureSettings = key('font-feature-settings')

export const $fontKerning = key('font-kerning')

export const $fontLanguageOverride = key('font-language-override')

export const $fontOpticalSizing = key('font-optical-sizing')

export const $fontPalette = key('font-palette')

export const $fontSize = key('font-size')

export const $fontSizeAdjust = key('font-size-adjust')

export const $fontStretch = key('font-stretch')

export const $fontStyle = key('font-style')

export const $fontSynthesis = key('font-synthesis')

export const $fontSynthesisSmallCaps = key('font-synthesis-small-caps')

export const $fontSynthesisStyle = key('font-synthesis-style')

export const $fontSynthesisWeight = key('font-synthesis-weight')

export const $fontVariant = key('font-variant')

export const $fontVariantAlternates = key('font-variant-alternates')

export const $fontVariantCaps = key('font-variant-caps')

export const $fontVariantEastAsian = key('font-variant-east-asian')

export const $fontVariantEmoji = key('font-variant-emoji')

export const $fontVariantLigatures = key('font-variant-ligatures')

export const $fontVariantNumeric = key('font-variant-numeric')

export const $fontVariantPosition = key('font-variant-position')

export const $fontVariationSettings = key('font-variation-settings')

export const $fontWeight = key('font-weight')

export const $fontWidth = key('font-width')

/** 字形选择的 CSS 原名与具名 Key 对应表。 */
export const fontKeys = {
  'font': $font,
  'font-family': $fontFamily,
  'font-feature-settings': $fontFeatureSettings,
  'font-kerning': $fontKerning,
  'font-language-override': $fontLanguageOverride,
  'font-optical-sizing': $fontOpticalSizing,
  'font-palette': $fontPalette,
  'font-size': $fontSize,
  'font-size-adjust': $fontSizeAdjust,
  'font-stretch': $fontStretch,
  'font-style': $fontStyle,
  'font-synthesis': $fontSynthesis,
  'font-synthesis-small-caps': $fontSynthesisSmallCaps,
  'font-synthesis-style': $fontSynthesisStyle,
  'font-synthesis-weight': $fontSynthesisWeight,
  'font-variant': $fontVariant,
  'font-variant-alternates': $fontVariantAlternates,
  'font-variant-caps': $fontVariantCaps,
  'font-variant-east-asian': $fontVariantEastAsian,
  'font-variant-emoji': $fontVariantEmoji,
  'font-variant-ligatures': $fontVariantLigatures,
  'font-variant-numeric': $fontVariantNumeric,
  'font-variant-position': $fontVariantPosition,
  'font-variation-settings': $fontVariationSettings,
  'font-weight': $fontWeight,
  'font-width': $fontWidth,
}
