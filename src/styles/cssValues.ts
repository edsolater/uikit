import { isString } from '@edsolater/fnkit'
import { CSSColorString } from './type'
export const tailwindColors = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  zinc50: '#fafafa',
  zinc100: '#f4f4f5',
  zinc200: '#e4e4e7',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
  zinc900: '#18181b',

  neutral50: '#fafafa',
  neutral100: '#f5f5f5',
  neutral200: '#e5e5e5',
  neutral300: '#d4d4d4',
  neutral400: '#a3a3a3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#171717',

  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone600: '#57534e',
  stone700: '#44403c',
  stone800: '#292524',
  stone900: '#1c1917',

  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red300: '#fca5a5',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  red800: '#991b1b',
  red900: '#7f1d1d',

  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  orange300: '#fdba74',
  orange400: '#fb923c',
  orange500: '#f97316',
  orange600: '#ea580c',
  orange700: '#c2410c',
  orange800: '#9a3412',
  orange900: '#7c2d12',

  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber300: '#fcd34d',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  amber800: '#92400e',
  amber900: '#78350f',

  yellow50: '#fefce8',
  yellow100: '#fef9c3',
  yellow200: '#fef08a',
  yellow300: '#fde047',
  yellow400: '#facc15',
  yellow500: '#eab308',
  yellow600: '#ca8a04',
  yellow700: '#a16207',
  yellow800: '#854d0e',
  yellow900: '#713f12',

  lime50: '#f7fee7',
  lime100: '#ecfccb',
  lime200: '#d9f99d',
  lime300: '#bef264',
  lime400: '#a3e635',
  lime500: '#84cc16',
  lime600: '#65a30d',
  lime700: '#4d7c0f',
  lime800: '#3f6212',
  lime900: '#365314',

  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green300: '#86efac',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  green900: '#14532d',

  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald300: '#6ee7b7',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',
  emerald900: '#064e3b',

  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  teal200: '#99f6e4',
  teal300: '#5eead4',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',

  cyan50: '#ecfeff',
  cyan100: '#cffafe',
  cyan200: '#a5f3fc',
  cyan300: '#67e8f9',
  cyan400: '#22d3ee',
  cyan500: '#06b6d4',
  cyan600: '#0891b2',
  cyan700: '#0e7490',
  cyan800: '#155e75',
  cyan900: '#164e63',

  sky50: '#f0f9ff',
  sky100: '#e0f2fe',
  sky200: '#bae6fd',
  sky300: '#7dd3fc',
  sky400: '#38bdf8',
  sky500: '#0ea5e9',
  sky600: '#0284c7',
  sky700: '#0369a1',
  sky800: '#075985',
  sky900: '#0c4a6e',

  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue300: '#93c5fd',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue800: '#1e40af',
  blue900: '#1e3a8a',

  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo200: '#c7d2fe',
  indigo300: '#a5b4fc',
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo800: '#3730a3',
  indigo900: '#312e81',

  violet50: '#f5f3ff',
  violet100: '#ede9fe',
  violet200: '#ddd6fe',
  violet300: '#c4b5fd',
  violet400: '#a78bfa',
  violet500: '#8b5cf6',
  violet600: '#7c3aed',
  violet700: '#6d28d9',
  violet800: '#5b21b6',
  violet900: '#4c1d95',

  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple200: '#e9d5ff',
  purple300: '#d8b4fe',
  purple400: '#c084fc',
  purple500: '#a855f7',
  purple600: '#9333ea',
  purple700: '#7e22ce',
  purple800: '#6b21a8',
  purple900: '#581c87',

  fuchsia50: '#fdf4ff',
  fuchsia100: '#fae8ff',
  fuchsia200: '#f5d0fe',
  fuchsia300: '#f0abfc',
  fuchsia400: '#e879f9',
  fuchsia500: '#d946ef',
  fuchsia600: '#c026d3',
  fuchsia700: '#a21caf',
  fuchsia800: '#86198f',
  fuchsia900: '#701a75',

  pick50: '#fdf2f8',
  pick100: '#fce7f3',
  pick200: '#fbcfe8',
  pick300: '#f9a8d4',
  pick400: '#f472b6',
  pick500: '#ec4899',
  pick600: '#db2777',
  pick700: '#be185d',
  pick800: '#9d174d',
  pick900: '#831843',

  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  rose700: '#be123c',
  rose800: '#9f1239',
  rose900: '#881337'
}

export const cssColors = {
  screenBg: '#f3f5f7',

  cardBg: '#ffffffcc',
  cardBg2: '#ffffffdd',
  cardBgDark: '#515254e0',

  cardSelected: '#d3d6d99e',
  textColor: tailwindColors.gray800,
  labelColor: tailwindColors.gray500,
  secondaryTextColor: tailwindColors.gray500,
  secondaryLabelColor: tailwindColors.gray400,

  white: '#ffffff',
  black: '#000000',

  dodgerBlue: '#1e90ff' as CSSColorString,
  dodgerBlueDark: '#1e90ff' as CSSColorString,
  transparent: 'transparent',

  opacityGray: '#6767675e' as CSSColorString,
  /** use for dark mode button default  color */
  buttonPrimaryColor: tailwindColors.indigo600
} as const

export const cssSelectedStateColor = cssColors.opacityGray

export function opacityCSSColor(cssColor: CSSColorString, /* 0~1 */ opacity: number) {
  return cssColor === cssColors.buttonPrimaryColor ? '#7c859826' /* 0.15 */ : `${cssColor}${opacity}` //TODO: temp
}

export function darkenCSSColor(cssColor: CSSColorString, degree: number) {
  return cssColor === cssColors.buttonPrimaryColor ? '#2c374f' : `${cssColor}${degree}` //TODO: temp
}
export function mergeCSSColor(cssColor: CSSColorString, degree: number, cssColor2: CSSColorString, degree2: number) {
  return cssColor === cssColors.buttonPrimaryColor ? '#2c374f' : `${cssColor}${degree}` //TODO: temp
}

export function isCSSColorString6Hex(cssColor: unknown): cssColor is CSSColorString {
  return isString(cssColor) && /^\#[0-9|a-f|A-F]{6}$/.test(cssColor)
}

export const cssSize = {
  roundedSmall: '4px'
} as const

export const cssShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.025)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.125)'
} as const

export const cssTransitionTimeFnLinear = 'linear'

export const cssTransitionTimeFnEaseOut = 'ease-out'
export const cssTransitionTimeFnOutSine = 'cubic-bezier(0.39, 0.58, 0.57, 1)'
export const cssTransitionTimeFnOutQuadratic = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
export const cssTransitionTimeFnOutCubic = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
export const cssTransitionTimeFnLinearOutSlowIn = 'cubic-bezier(0, 0, 0.2, 1)'
export const cssTransitionTimeFnOutBack = 'cubic-bezier(0.18, 0.89, 0.32, 1.28)'

export const cssTransitionTimeFnEaseIn = 'ease-in'
export const cssTransitionTimeFnInSine = 'cubic-bezier(0.47, 0, 0.75, 0.72)'
export const cssTransitionTimeFnInQuadratic = 'cubic-bezier(0.55, 0.09, 0.68, 0.53)'
export const cssTransitionTimeFnInCubic = 'cubic-bezier(0.55, 0.06, 0.68, 0.19)'
export const cssTransitionTimeFnInFastOutLinearIn = 'cubic-bezier(0.4, 0, 1, 1)'
export const cssTransitionTimeFnInBack = 'cubic-bezier(0.6, -0.28, 0.74, 0.05)'

export const cssTransitionTimeFnEaseInOut = 'ease-in-out'
export const cssTransitionTimeFnInOutSine = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)'
export const cssTransitionTimeFnInOutQuadratic = 'cubic-bezier(0.46, 0.03, 0.52, 0.96)'
export const cssTransitionTimeFnInOutCubic = 'cubic-bezier(0.65, 0.05, 0.36, 1)'
export const cssTransitionTimeFnInOutFastOutSlowIn = 'cubic-bezier(0.4, 0, 0.2, 1)'
export const cssTransitionTimeFnInOutBack = 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
