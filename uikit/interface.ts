export interface BaseStyle<BaseStyleProps extends Record<string, any>> {
  baseStyle?: BaseStyleValue<BaseStyleProps>
}

export type BaseStyleValue<BaseStyleProps extends Record<string, any>> = BaseStyleProps | 'none'
