import { registCssVariable, cssVariable } from '../core/css-variable';
import { cssColorMix } from './css-web-utils';

/** 代表 任意组件 的 表面颜色（纯粹印象的主体色） */

export const surfaceColor = registCssVariable({
  type: 'color',
  name: 'surface-color',
  value: {
    default: cssVariable('dye-neutral-1'),
    hover: cssVariable('dye-neutral-2'),
    active: cssVariable('dye-neutral-3'),
  },
});

export const bgColor = registCssVariable({
  type: 'color',
  name: 'bg',
  value: {
    default: cssColorMix([cssVariable('surface-color'), 0.82], cssVariable('color-accent-soft')),
    hover: cssColorMix([cssVariable('surface-color-hover'), 0.72], cssVariable('color-accent-soft')),
    active: cssColorMix([cssVariable('surface-color-active'), 0.62], cssVariable('color-accent-soft')),
  },
});

export const fgColor = registCssVariable({
  type: 'color',
  name: 'fg',
  value: {
    default: cssVariable('color-fg'), // TODO: 这里还不对，需要确认用什么颜色,但此时修改 api
    hover: cssVariable('color-fg-strong'),
    active: cssVariable('color-fg-strong'),
  },
});
