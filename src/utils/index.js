export function isObject(target) {
  return typeof target === 'object' && target !== null
}

// 值是否改变，（NaN != NaN）
export function hasChanged(oldValue, newValue) {
  return oldValue !== newValue && !(isNaN(oldValue) && isNaN(newValue))
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