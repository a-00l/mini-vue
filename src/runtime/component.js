import { compile } from "../compiler/compiler.js"
import { effect, reactive, queueJob, normalizeVNode, patch } from "../reactive/index.js"

function updateProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode
  const props = (instance.props = {})
  const attrs = (instance.attrs = {})

  // 区分属性和props
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      props[key] = vnodeProps[key]
    } else {
      attrs[key] = vnodeProps[key]
    }
  }

  instance.props = reactive(instance.props)
}

export function mountComponent(vnode, container, anchor) {
  const { type: Component } = vnode
  // 组件实例
  const instance = (vnode.component = {
    props: null, // 组件接收参数
    attrs: null, // props中没有接收的
    setupState: null,
    isMounted: false, // 第一次挂载组件
    subTree: null, // 记录旧的节点
    update: null, // 更新组件函数
    ctx: null, // 用于组件中render(ctx)函数的参数
    next: null,
  })

  // 区分props和attrs
  updateProps(instance, vnode)
  // 获取setup组件中返回的值
  instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs })

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  }

  if (!Component.render && Component.template) {
    const { template } = Component
    const code = compile(template)
    console.log(code);

    Component.render = new Function('ctx', code)
  }

  // 更新dom
  instance.update = effect(() => {
    // 第一次执行mount挂载组件
    // 第二次更新组件
    if (!instance.isMounted) {
      const subTree = (instance.subTree = createSubTree(Component, instance))

      patch(null, subTree, container, anchor)
      vnode.el = subTree.el
      instance.isMounted = true
    } else {
      // 被动更新
      if (instance.next) {
        // 获取要更新的组件
        vnode = instance.next
        instance.next = null
        // 设置新的props
        updateProps(instance, vnode)
        // 更新render参数（因为没有为instance.ctx添加Proxy，所以需要手动修改）
        instance.ctx = {
          ...instance.props,
          ...instance.setupState,
        }
      }

      // 获取上一个组件信息
      const prev = instance.subTree
      // 获取当前组件信息
      const subTree = (instance.subTree = createSubTree(Component, instance))

      patch(prev, subTree, container, anchor)
      vnode.el = subTree.el
    }
  }, {
    scheduler: queueJob
  })
}

// 抽取生成subTree的逻辑为函数
const createSubTree = (Component, instance) => {
  // 获取要渲染的信息
  const subTree = normalizeVNode(Component.render(instance.ctx))
  // 添加attr属性
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs
    }
  }

  return subTree
}