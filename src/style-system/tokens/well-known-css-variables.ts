/** 组合组件共享的默认颜色及状态颜色定义。 */
import { registerVariable, variable } from '../core/derive/css-variable';
import { colorMix } from './css-color-mix';

/** 代表 任意组件 的 表面颜色（纯粹印象的主体色） */

export const surfaceColor = registerVariable({
  type: 'color',
  name: 'surface-color',
  value: {
    default: variable('dye-neutral-1'),
    hover: variable('dye-neutral-2'),
    active: variable('dye-neutral-3'),
  },
});

export const bgColor = registerVariable({
  type: 'color',
  name: 'bg',
  value: {
    default: colorMix([variable('surface-color'), 0.82], variable('color-accent-soft')),
    hover: colorMix([variable('surface-color-hover'), 0.72], variable('color-accent-soft')),
    active: colorMix([variable('surface-color-active'), 0.62], variable('color-accent-soft')),
  },
});

export const fgColor = registerVariable({
  type: 'color',
  name: 'fg',
  value: {
    default: variable('color-fg'), // TODO: 这里还不对，需要确认用什么颜色,但此时修改 api
    hover: variable('color-fg-strong'),
    active: variable('color-fg-strong'),
  },
});
