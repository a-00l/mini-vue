import { isNumber, isString } from "../utils/index.js";

export const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
};

const Text = Symbol('Text')
const Fragment = Symbol('Fragment')

/**
 * 
 * @param {string | Object | Text | Fragment} type 
 * @param {object | null  } props 
 * @param {array | string | number} children 
 * @returns  VNode
 */
export function h(type, props, children) {
  const shapeFlag = 0
  if (type === Text) {
    shapeFlag = ShapeFlags.TEXT
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT
  } else if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else {
    shapeFlag = ShapeFlags.COMPONENT
  }

  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return {
    type,
    props,
    children,
    shapeFlag
  }
}