// 设置props
export function patchProps(oldProps, newProps, el) {
  if (oldProps === newProps) {
    return
  }

  oldProps = oldProps ?? {}
  newProps = newProps ?? {}
  // 将新设置的属性一一对比
  for (const key in newProps) {
    const oldValue = oldProps[key]
    const newValue = newProps[key]
    if (newValue != oldValue) {
      patchDomProp(newValue, oldValue, key, el)
    }
  }

  // 删除旧的属性
  for (const key in oldProps) {
    if (newProps[key] === null) {
      patchDomProp(oldProps[key], null, key, el)
    }
  }
}

// 检查boolean属性
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
function patchDomProp(oldValue, newValue, key, el) {
  switch (key) {
    // 处理class属性
    case 'class':
      el.class = newValue
      break;
    // 处理style属性
    case 'style':
      // 设置style
      for (const styleName in newValue) {
        el.style[styleName] = newValue[styleName]
      }

      // 如果oldValue中有newValue没有的style属性，则将该属性设置为空
      if (oldValue) {
        for (const oldKay in oldValue) {
          if (newValue[oldKay] === null) {
            el.style[oldKay] = ''
          }
        }
      }
      break;
    default:
      // 处理事件
      if (/^on[A-Z]/.test(key)) {
        const event = key.slice(2).toLocaleLowerCase()
        // 删除旧的事件，添加新的事件
        if (oldValue) {
          el.removeEventListener(event)
        }

        if (newValue) {
          el.addEventListener(event, newValue)
        }
      } else if (domPropsRE.test(key)) {
        // 特殊情况,boolean属性设置为空
        if (newValue === '' && isBoolean(el[key])) {
          newValue = true
        }

        // 处理checked这类Boolean属性
        el[key] = newValue
      } else {
        // 特殊情况,属性为空或设置为false,则删除该属性
        if (newValue === null || newValue === false) {
          el.removeAttribute(key)
        } else {
          // 设置普通属性
          el.setAttribute(key, newValue)
        }
      }
      break;
  }
}