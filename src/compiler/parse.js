import { isNativeTag, isVoidTag } from './index.js';
import { camelize } from '../utils/index.js';
import { createRoot, ElementTypes, NodeTypes } from './ast.js'
// 解析为AST树
export function parse(content) {
  const context = createParseContext(content)
  const children = parseChildren(context)
  return createRoot(children)
}

/**
 * @description 解析子节点
 * @param {object} context 
 * @returns 
 */
function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    let node;
    const s = context.source
    // 1.是否为插值{{  }}
    if (s.startsWith(context.option.delimiter[0])) {
      node = parseInterpolation(context)
    }
    // 2.是否遇到了<（解析标签）
    else if (s.startsWith('<')) {
      node = parseElement(context)
    }
    // 3.解析文本
    else {
      node = parseText(context)
    }

    nodes.push(node)
  }

  // 是否需要过滤
  let removeWhiteSpace = null
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
      // 包含非空白字符
      if (/[^\t\r\f\n ]/.test(node.content)) {
        node.content.replace(/[\t\r\f\n]+/g, ' ')
      }
      // 全是空白字符
      else {
        // 前后节点是否为空
        const prev = nodes[i - 1]
        const next = nodes[i + 1]
        // 1.当前空白节点是否在最前方或最后方
        // 2.空白节点夹在两个元素之间则删除如下
        if (
          !prev ||
          !next ||
          (prev.type === NodeTypes.ELEMENT &&
            next.type === NodeTypes.ELEMENT &&
            /[\r\n]/.test(node.content)
          )
        ) {
          removeWhiteSpace = true
          nodes[i] = null
        } else {
          node.content = ' '
        }
      }
    }
  }

  // 过滤
  return removeWhiteSpace ? nodes.filter(Boolean) : nodes
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

  if (element.isSelfClosing || context.option.isVoidTag(element.tag)) {
    return element;
  }

  // 解析children
  element.children = parseChildren(context)
  // 解析末尾标签
  parseTag(context)

  return element
}

function parseTag(context) {
  // 匹配以 < 开头，可含 /（表示闭合标签）
  // 后跟以小写字母开头且不含制表符、回车、换行、换页符、空格、/、> 的标签名的字符串，不区分大小写。
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  // 获取解析后的标签
  let tag = match[1]
  // 删除标签，删除空格
  advanceBy(context, match[0].length)
  advanceSpaces(context)

  // 是否为组件
  const tagType = isComponent(tag, context) ? ElementTypes.COMPONENT : ElementTypes.ELEMENT
  // 解析属性
  const { props, directives } = parseAttributes(context)
  // 是否为闭合标签
  const isSelfClosing = match[0].includes('</')
  // 如果闭合<input />则删除/>，如果不是闭合<div>则删除>
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag, // 标签名,
    tagType, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing, // 是否是自闭合标签,
    children: [],
  }
}

// 解析属性
function parseAttributes(context) {
  const props = []
  const directives = []
  // 条件结束：字符串末尾，闭合标签（/>）或>
  while (
    context.source.length &&
    !context.source.startsWith('/>') &&
    !context.source.startsWith('>')
  ) {
    let attr = parseAttribute(context)
    // 1.指令
    if (attr.type === NodeTypes.DIRECTIVE) {
      directives.push(attr)
    }
    // 2.属性
    else {
      props.push(attr)
    }
  }

  return { props, directives }
}

/**
 * @description 解析属性
 * @param {object} context 
 */
function parseAttribute(context) {
  // 匹配属性如：id='123'，匹配到：id
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  // 获取属性
  const name = match[0]
  let value;
  advanceBy(context, name.length)
  advanceSpaces(context)
  if (context.source[0] === '=') {
    // 去掉 = 
    advanceBy(context, 1)
    advanceSpaces(context)
    // 获取属性值
    value = parseAttributeValue(context)
    advanceSpaces(context)
  }

  // <div id="12" class="  asd" v-if="ok"></div>
  // 捕获指令属性
  if (/^(:|@|v-)/.test(name)) {
    let dirName, argContent;
    if (name[0] === ':') {
      dirName = 'bind'
      argContent = name.slice(1)
    } else if (name[0] === '@') {
      dirName = 'on'
      argContent = name.slice(1)
    } else if (name.startsWith('v-')) {
      [dirName, argContent] = name.slice(2).split(':')
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      }, // 表达式节点
      arg: argContent && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: camelize(argContent),
        isStatic: true,
      }, // 表达式节点
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  }
}

// 获取属性的值
function parseAttributeValue(context) {
  // 引号可以是单引号或双引号
  const quote = context.source[0]
  // 去掉引号
  advanceBy(context, 1)
  const endIndex = context.source.indexOf(quote)
  const content = parseTextData(context, endIndex)
  // 去掉属性值后面的引号
  advanceBy(context, 1)

  return { content }
}

function isComponent(tag, context) {
  return !context.option.isNativeTag(tag)
}

// 解析文本
// 缺陷：遇到 a < b或 </ 会错误解析
function parseText(context) {
  // 结束符号标记
  const endTokens = ['<', context.option.delimiter[0]]
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // 找到最靠左的结束位置
    if (index < endIndex && index != -1) {
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
  advanceBy(context, length)
  return text
}

/**
 * 
 * @param {object} content 
 * @returns 上下文
 */
function createParseContext(content) {
  return {
    option: {
      delimiter: ['{{', '}}'],
      isVoidTag,
      isNativeTag
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
  return context.source.startsWith('</') || !context.source
}