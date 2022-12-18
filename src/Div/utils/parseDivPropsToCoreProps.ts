import { flapDeep, merge, shakeFalsy, shakeNil } from '@edsolater/fnkit';
import { invokeOnce } from '../../functions/dom/invokeOnce';
import classname from '../../functions/react/classname';
import mergeRefs, { loadRef } from '../../functions/react/mergeRefs';
import { parseCSS } from '../../styles/parseCSS';
import { DivProps } from '../type';

export function parseDivPropsToCoreProps(
  divProps: Omit<DivProps<any>, 'plugins' | 'tag' | 'shadowProps' | 'children'> & {
    children?: React.ReactNode;
  }) {
  return {
    ...(divProps.htmlProps && Object.assign({}, ...flapDeep(divProps.htmlProps))),
    className: shakeFalsy([classname(divProps.className), parseCSS(divProps.icss)]).join(' ') ||
      undefined /* don't render if empty string */,
    ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep(divProps.domRef)), el)),
    style: divProps.style ? merge(...flapDeep(shakeNil(divProps.style))) : undefined,
    onClick: divProps.onClick
      ? (ev) => flapDeep([divProps.onClick]).map((onClick) => onClick?.({ event: ev, ev, el: ev.currentTarget }))
      : undefined
  };
}
