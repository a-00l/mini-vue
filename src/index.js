import { render } from "./runtime/render.js";
import { Fragment, h, Text } from "./runtime/vnode.js";

render(
  h('ul', null, [
    h('li', null, 'first'),
    h(Fragment, null, [
      h('li', null, 'middle1111'),
    ]),
    h('li', null, 'last'),
  ]),
  document.body
);
setTimeout(() => {
  render(
    h('ul', null, [
      h('li', null, 'first'),
      h(Fragment, null, [
        h('li', null, 'middle'),
      ]),
      h('li', null, 'last'),
    ]),
    document.body
  );
}, 2000);