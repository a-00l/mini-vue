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

      // 渲染
      render(h(rootComponent), rootContainer)
    }
  }

  return app
}