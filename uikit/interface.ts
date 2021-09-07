export interface BaseStyle<BaseStyleProps extends Record<string, any> = Record<string, any>> {
  baseStyle?: BaseStyleProps | 'none'
}
