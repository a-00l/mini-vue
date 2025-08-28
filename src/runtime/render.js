import { patchProps } from "./patchProps.js"
import { ShapeFlags } from "./vnode.js"

export function render(vnode, container) {
  const prevVNode = container._vnode
  if (!vnode) {
    if (prevVNode) {
      unmount(prevVNode)
    }
  } else {
    // 比较两个dom有什么不同
    patch(prevVNode, vnode, container)
  }

  container._vnode = vnode
}

function unmount(vnode) {
  const { shapeFlag, el } = vnode
  if (shapeFlag & ShapeFlags.COMPONENT) {
    // 卸载组件
    unmountComponents(vnode)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    // 卸载Fragment
    unmountFragment(vnode)
  } else {
    // 卸载Text、Element节点
    el.parentNode.removeChild(el)
  }
}

function unmountComponents(vnode) {
  //  TODO
}

// 删除所有fragment节点
function unmountFragment(vnode) {
  const { el: cur, anchor: end } = vnode
  const { parentNode } = cur;
  while (cur != end) {
    const next = cur.nextSibling
    parentNode.removeChild(cur)
    cur = next
  }

  parentNode.removeChild(end)
}

// 比较两个节点的不同
function patch(n1, n2, container, anchor) {
  if (n1 && !isSameType(n1, n2)) {
    anchor = (n1.anchor || n1.el).nextSibling
    unmount(n1)
    n1 = null
  }

  const { shapeFlag } = n2
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponents(n1, n2, container, anchor)
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container, anchor)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor)
  } else {
    processElement(n1, n2, container, anchor)
  }
}

function processComponents() {
  // TODO
}

// 处理新节点为Fragment
function processFragment(n1, n2, container, anchor) {
  const fragmentStartAnchor = n2.el = n1 ? n1.el : document.createTextNode('')
  const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : document.createTextNode('')
  if (n1) {
    patchChildren(n1, n2, container, fragmentEndAnchor)
  } else {
    container.insertBefore(fragmentStartAnchor, anchor)
    container.insertBefore(fragmentEndAnchor, anchor)
    mountChildren(n2.children, container, fragmentEndAnchor)
  }
}

// 处理新节点为Element
function processElement(n1, n2, container, anchor) {
  if (n1) {
    patchElement(n1, n2, container)
  } else {
    mountElement(n2, container, anchor)
  }
}

// 处理新节点为Text
function processText(n1, n2, container, anchor) {
  if (n1) {
    n2.el = n1.el
    n1.el.textContent = n2.children
  } else {
    mountTextVNode(n2, container, anchor)
  }
}

// 比较两个vnode节点的区别
function patchElement(n1, n2) {
  n2.el = n1.el
  patchProps(n1.props, n2.props, n2.el)
  patchChildren(n1, n2, n2.el)
}

// 比较n1和n2的children的区别
function patchChildren(n1, n2, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1
  const { shapeFlag, children: c2 } = n2
  // n2可能：TEXT、ARRAY、NULL
  // 每个n2下面n1都可能为：TEXT、ARRAY、NULL
  // 一共九种可能
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1)
    }

    container.textContent = c2
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
      // 挂载children
      mountChildren(n2, container, anchor)
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
        // 有key
        patchKeyedChildren(c1, c2, container, anchor)
      } else {
        // 没key
        patchArrayChildren(c1, c2, container, anchor)
      }
    } else {
      mountChildren(n2, container, anchor)
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1)
    }
  }
}

function patchKeyedChildren(c1, c2, container, anchor) {
  const i = 0;
  const e1 = c1.length - 1
  const e2 = c2.length - 1

  // 1.从左至右依次对比
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor)
    i++
  }

  // 2.从右至左依次对比
  while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
    patch(c1[e1], c2[e2], container, anchor)
    e1--
    e2--
  }

  if (i > e1) {
    // 3.经过1、2直接将旧结点比对完，则剩下的新结点直接mount
    for (let j = i; j <= e2; j++) {
      const nextPos = e2 + 1
      const curAnchor = c2[nextPos] ? c2[nextPos].el : anchor
      patch(null, c2[j], container, curAnchor)
    }
  } else if (i > e2) {
    // 3.经过1、2直接将旧结点比对完，则剩下的新结点直接unmount
    for (let j = i; j <= e1; j++) {
      unmount(c1[j])
    }
  } else {
    // 4.若不满足 3，采用传统 diff 算法，但不真的添加和移动，只做标记和删除 取得一个 source 数组
    const map = new Map()
    const source = new Array(e2 - i + 1).fill(-1)
    // 将所有旧节点保存至map
    c1.forEach((prev, j) => {
      map.set(prev.key, { prev, j })
    })

    let maxNewIndex = 0
    const toMounted = []
    for (let k = 0; k < c2.length; k++) {
      const next = c2[k]
      let move = false
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key)
        // 进行比较
        patch(prev, next, container, anchor)
        // 如果j在maxNewIndex左边，则移动
        if (j < maxNewIndex) {
          move = true
        } else {
          maxNewIndex = j
        }

        // 记录新数组的元素在旧数组中的下标
        source[k] = j
        // 删除操作后的key
        map.delete(next.key)
      } else {
        toMounted.push(k + i)
      }

      // 最后剩下的就是新节点中没有的dom，可以删除
      map.forEach(({ prev }) => unmount(prev))
      if (move) {
        // 5.需要移动，则采用新的最长上升子序列算法
        const seq = setSequence(source)
        const j = seq.length - 1
        for (let k = source.length - 1; k >= 0; k--) {
          if (seq[k] === j) {
            j--
          } else {
            const pos = k + i
            const nextIndex = pos + 1
            const curAnchor = c2[nextIndex] ? c2[nextIndex].el : anchor
            if (source[k] === -1) {
              // mount
              patch(null, c2[pos], container, curAnchor)
            } else {
              // 移动
              container.insertBefore(c2[pos].el, curAnchor)
            }
          }
        }
      } else if (toMounted.length) {
        for (let k = toMounted.length - 1; k >= 0; k--) {
          const pos = toMounted[k]
          const nextIndex = pos + 1
          const curAnchor = c2[nextIndex] ? c2[nextIndex].el : anchor
          patch(null, c2[pos], container, curAnchor)
        }
      }
    }
  }
}

function patchArrayChildren(c1, c2, container, anchor) {
  const oldLength = c1.length
  const newLength = c2.length
  const commonLength = Math.min(oldLength, newLength)
  // 将公共的children进行比较
  for (let i = 0; i < commonLength; i++) {
    patch(c1[i], c2[i], container, anchor)
  }

  if (oldLength > newLength) {
    // 卸载旧值多出来的children
    unmountChildren(c1.slice(commonLength))
  } else {
    // 挂载新值多出来的children
    mountChildren(c2.slice(commonLength), container, anchor)
  }
}
// 卸载children
function unmountChildren(children) {
  children.forEach(child => {
    unmount(child)
  })
}

// 挂载文本节点
function mountTextVNode(vnode, container, anchor) {
  // 创建虚拟字符串dom
  const text = document.createTextNode(vnode.children)
  container.insertBefore(text, anchor)
  // 记录节点
  vnode.el = text
}

// 挂载dom节点
function mountElement(vnode, container, anchor) {
  const { shapeFlag, children } = vnode
  const el = document.createElement(vnode.type)
  // 设置props
  patchProps(null, vnode.props, el)
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextVNode(vnode, el)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el)
  }

  container.insertBefore(el, anchor)
  // 记录节点
  vnode.el = el
}

// 挂载children节点
function mountChildren(children, container, anchor) {
  children.forEach(child => {
    patch(null, child, container, anchor)
  })
}

function isSameType(n1, n2) {
  return n1.type === n2.type
}

