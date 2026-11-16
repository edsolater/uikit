/**
 * Button 外观选值的原生描述映射。
 *
 * 将未指定的外观转换为 outlined，明确按钮默认呈现。
 *
 * 映射与候选值分开维护，选值来源仍由 Variant 解析器持续消费。
 */
export const buttonMapping = {
  appearance: { undefined: 'outlined' },
} as const
