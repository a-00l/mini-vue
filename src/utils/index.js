export function isObject(target) {
  return typeof target === 'object' && target !== null
}

// 值是否改变，（NaN != NaN）
export function hasChanged(oldValue, newValue) {
  return oldValue !== newValue && !(isNaN(oldValue) && isNaN(newValue))
}

export function isArray(target) {
  return Array.isArray(target)
}