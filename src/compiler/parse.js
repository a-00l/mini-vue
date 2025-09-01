import { NodeTypes } from './ast'
function parse(content) {
  const context = createParseContext(content)
  parseChildren(context)
}

function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    let node;
    const s = context.source
    // 1.是否为插值{{  }}
    if (s.startWith(context.option[0])) {
      node = parseInterpolation(context)
    }
    // 2.是否遇到了<（解析标签）
    else if (s.startWith('<')) {
      node = parseElement(context)
    }
    // 3.解析文本
    else {
      node = parseText(context)
    }

    nodes.push(node)
  }

  return nodes
}

/**
 * @description 解析插值
 * @param {object} context 
 * @returns 
 */
function parseInterpolation(context) {
  // 截断 {{
  advanceBy(context, 2)
  // 插值找到结束位置
  let endIndex = context.source.indexOf('}}')
  // 获取新的字符串
  const content = parseTextData(context, endIndex).trim()
  // 截断 }}
  advanceBy(context, 2)
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      isStatic: false,
    }
  }
}

// 解析标签
function parseElement(context) {
  // 解析开始标签
  const element = parseTag(context)
  // 解析children
  parseChildren(context)
  // 解析末尾标签
  parseTag(context)

  return element
}

function parseTag(context) {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  // 获取解析后的标签
  let tag = match[1]
  // 删除标签，删除空格
  advanceBy(context, match[0].length)
  advanceSpaces(context)

  // 解析属性
  const { props, directives } = parseAttribute(context)
  // 是否为闭合标签
  const isSelfClosing = match[0].includes('</')
  // 如果闭合<input />则删除/>，如果不是闭合<div>则删除>
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag, // 标签名,
    tagType: ElementTypes, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing, // 是否是自闭合标签,
    children: [],
  }
}
// 解析文本
// 缺陷：遇到 a < b或 </ 会错误解析
function parseText(context) {
  // 结束符号标记
  const endTokens = ['<', context.option.delimiter[0]]
  const endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // 找到最靠左的结束位置
    if (index < endIndex) {
      endIndex = index
    }
  }

  // 获取截取后的文本
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content
  }
}

/**
 * @description 返回截取后的字符串
 * @param {object} context 
 * @param {number} length 截取长度
 * @returns 
 */
function parseTextData(context, length) {
  const text = context.source.slice(0, length)
  // 截取
  advanceBy(context, endIndex)
  return text
}

function createParseContext(content) {
  return {
    option: {
      delimiter: ['{{', '}}']
    },
    source: content
  }
}

/**
 * @description 截取字符串
 * @param {object} context 
 * @param {number} numberOfCharacters 截取长度
 */
function advanceBy(context, numberOfCharacters) {
  context.source = context.source.slice(numberOfCharacters)
}

/**
 * @description 删除空格、回车、换行、换页符
 * @param {object} context 
 */
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

// 碰到了结束符号，或者为空
function isEnd(context) {
  return context.source.startWith('</') || !context.source
}