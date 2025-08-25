import { isBoolean } from "../utils/index.js"
import { ShapeFlags } from "./vnode.js"
// 渲染虚拟函数
export function render(vnode, container) {
  mount(vnode, container)
}

// 挂载到dom
export function mount(vnode, container) {
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container)
  } else if (shapeFlag & ShapeFlags.TEXT) {
    mountTextVNode(vnode, container)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container)
  } else {
    mountComponent(vnode, container)
  }
}

// 挂载dom节点
function mountElement(vnode, container) {
  const el = document.createElement(vnode.type)
  // 设置props
  mountProps(vnode, el)
  // 设置children
  mountChildren(vnode, el)
  container.appendChild(el)
}

// 挂载文本节点
function mountTextVNode(vnode, container) {
  // 创建虚拟字符串dom
  const text = document.createTextNode(vnode.children)
  container.appendChild(text)
}

// 空节点,将他的children挂载到父节点下
function mountFragment(vnode, container) {
  mountChildren(vnode, container)
}

// TODO:组件挂载
function mountComponent(vnode, container) {

}

// 检查boolean属性
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
// 设置props
function mountProps(vnode, el) {
  const { props } = vnode

  for (const key in props) {
    let value = props[key]
    switch (key) {
      // 处理class属性
      case 'class':
        el.class = value
        break;
      // 处理style属性
      case 'style':
        // 设置style
        for (const styleName in value) {
          el.style[styleName] = value[styleName]
        }
        break;
      default:
        // 处理事件
        if (/^on[A-Z]/.test(key)) {
          const event = key.slice(2).toLocaleLowerCase()

          el.addEventListener(event, value)
        } else if (domPropsRE.test(key)) {
          // 特殊情况,boolean属性设置为空
          if (value === '' && isBoolean(el[key])) {
            value = true
          }

          // 处理checked这类Boolean属性
          el[key] = value
        } else {
          // 特殊情况,之位空或设置为false,则删除该属性
          if (value === null || value === false) {
            el.removeAttribute(key)
          } else {
            // 设置普通属性
            el.setAttribute(key, value)
          }
        }
        break;
    }
  }
}

// 挂载children节点
function mountChildren(vnode, container) {
  const { shapeFlag, children } = vnode
  // children为字符串
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextVNode(vnode, container)
  }
  // children为数组:([h()])
  else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    children.forEach(children => {
      mount(children, container)
    })
  }
}