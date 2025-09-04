import { isString } from "../utils/index.js"
import { render, h } from './index.js'

// rootComponent：外面setup、render组件参数
export function createApp(rootComponent) {
  const app = {
    // rootContainer：挂载容器
    mount(rootContainer) {
      // 处理mount('#app')这种写法
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer)
      }

      // 没有render函数且没有template，则寻找mount所指定的节点
      if (!rootComponent.render && !rootComponent.template) {
        rootComponent.template = rootContainer.innerHTML
      }

      // 注意：记得情况mount节点，不然会重复渲染
      rootContainer.innerHTML = ''
      // 渲染
      render(h(rootComponent), rootContainer)
    }
  }

  return app
}