export function isObject(target) {
  return typeof target === 'object' && target !== null
}

// 值是否改变，（NaN != NaN）
export function hasChanged(oldValue, newValue) {
  return oldValue !== newValue && !(Number.isNaN(oldValue) && Number.isNaN(newValue))
}

export function isString(target) {
  return typeof target === 'string'
}

export function isBoolean(target) {
  return typeof target === 'boolean'
}

export function isNumber(target) {
  return typeof target === 'number'
}

export function isArray(target) {
  return Array.isArray(target)
}

// 驼峰化：s-s-s：sSS
export function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// 大写第一个字母
export function capitalize(content) {
  return content[0].toUpperCase() + content.slice(1)
}