/**
 * Markdown 解析器
 * 将 Markdown 解析为思维导图树形结构
 */

import type { MindmapNode } from '@/types/mindmap'

/**
 * 解析器选项
 */
export interface ParserOptions {
  /** 是否解析备注语法 (默认 true) */
  parseNotes?: boolean
}


/**
 * 解析 Markdown，提取标题和备注
 * 支持两种备注格式：
 * 1. 行内格式：## 标题 > 备注
 * 2. 单独一行格式：## 标题 后面跟着 > 备注（中间可能有空行）
 */
function parseMarkdownWithNotes(markdown: string): Array<{ level: number; text: string; note?: string }> {
  const lines = markdown.split('\n')
  const result: Array<{ level: number; text: string; note?: string }> = []
  
  let currentNote = ''
  let prevHeadingIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 跳过空行
    if (!line) {
      continue
    }
    
    // 检查是否是标题行
    const headingMatch = line.match(/^(#+)\s+(.+)$/)
    if (headingMatch) {
      // 如果前一个标题有备注，保存它
      if (prevHeadingIndex >= 0 && currentNote) {
        result[prevHeadingIndex].note = currentNote.trim()
      }
      
      const level = headingMatch[1].length
      let text = headingMatch[2]
      
      // 检查行内备注格式
      const inlineNoteMatch = text.match(/^(.+?)\s*>\s*(.+)$/)
      if (inlineNoteMatch) {
        result.push({
          level,
          text: inlineNoteMatch[1].trim(),
          note: inlineNoteMatch[2].trim()
        })
        currentNote = ''
        prevHeadingIndex = -1
      } else {
        result.push({ level, text, note: undefined })
        currentNote = ''
        prevHeadingIndex = result.length - 1
      }
      continue
    }
    
    // 检查是否是备注行（blockquote）
    const blockquoteMatch = line.match(/^>\s*(.+)$/)
    if (blockquoteMatch && prevHeadingIndex >= 0) {
      // 累积备注内容，保留换行符（支持多行备注）
      currentNote += (currentNote ? '\n' : '') + blockquoteMatch[1]
      // 不清除 prevHeadingIndex，因为可能有连续的 blockquote
    } else if (prevHeadingIndex >= 0) {
      // 遇到非 blockquote 的非空行，清除备注状态
      currentNote = ''
      prevHeadingIndex = -1
    }
  }
  
  // 处理最后一个标题的备注
  if (prevHeadingIndex >= 0 && currentNote) {
    result[prevHeadingIndex].note = currentNote.trim()
  }
  
  return result
}

/**
 * 将 Markdown 解析为思维导图树形结构
 * 支持的语法：
 * - # 标题层级（h1 为根节点，h2-h6 为子节点）
 * - emoji 图标解析
 * - > 备注语法（两种格式）：
 *   - 行内格式：## 标题 > 备注内容
 *   - 单独一行格式：## 标题 后面跟着 > 备注内容（中间可有空行）
 */
export function parseMarkdownToTree(markdown: string, options?: ParserOptions): MindmapNode | null {
  if (!markdown || !markdown.trim()) {
    return null
  }

  const parseNotes = options?.parseNotes ?? true

  // 转换 emoji 快捷方式
  const content = convertEmojiShortcodes(markdown)

  // 解析标题和备注（支持两种格式）
  const parsedHeadings = parseNotes 
    ? parseMarkdownWithNotes(content)
    : content.split('\n')
        .filter(line => line.trim().match(/^#+\s+/))
        .map(line => {
          const match = line.trim().match(/^(#+)\s+(.+)$/)
          return match ? { level: match[1].length, text: match[2] } : null
        })
        .filter(Boolean) as Array<{ level: number; text: string; note?: string }>

  if (parsedHeadings.length === 0) {
    return null
  }

  // 直接构建树形结构
  const root = parsedHeadings[0]
  const rootNode: MindmapNode = {
    id: generateId(),
    text: root.text,
    level: root.level,
    children: [],
  }

  if (root.note) {
    rootNode.note = root.note
  }

  if (parsedHeadings.length === 1) {
    return rootNode
  }

  // 使用栈来跟踪层级
  const stack: Array<{ node: MindmapNode; level: number }> = [
    { node: rootNode, level: root.level },
  ]

  for (let i = 1; i < parsedHeadings.length; i++) {
    const heading = parsedHeadings[i]

    const newNode: MindmapNode = {
      id: generateId(),
      text: heading.text,
      level: heading.level,
      children: [],
    }

    // 如果有备注，设置备注
    if (heading.note) {
      newNode.note = heading.note
    }

    // 找到正确的父节点
    let parent: MindmapNode | null = null
    while (stack.length > 0) {
      const top = stack[stack.length - 1]
      if (top.level < heading.level) {
        parent = top.node
        break
      }
      stack.pop()
    }

    if (parent) {
      parent.children.push(newNode)
    }

    stack.push({ node: newNode, level: heading.level })
  }

  return rootNode
}

// emoji 映射表
const emojiMap: Record<string, string> = {
  ':star:': '⭐',
  ':book:': '📚',
  ':bulb:': '💡',
  ':target:': '🎯',
  ':rocket:': '🚀',
  ':gear:': '⚙️',
  ':chart:': '📊',
  ':clock:': '🕐',
  ':calendar:': '📅',
  ':warning:': '⚠️',
  ':check:': '✅',
  ':x:': '❌',
  ':heart:': '❤️',
  ':sun:': '☀️',
  ':moon:': '🌙',
  ':fire:': '🔥',
  ':money:': '💰',
  ':key:': '🔑',
  ':lock:': '🔒',
  ':unlock:': '🔓',
  ':bell:': '🔔',
  ':sparkles:': '✨',
  ':zap:': '⚡',
  ':art:': '🎨',
  ':musical:': '🎵',
  ':camera:': '📷',
  ':video:': '🎬',
  ':phone:': '📱',
  ':email:': '📧',
  ':pencil:': '✏️',
  ':paper:': '📄',
  ':folder:': '📁',
  ':trash:': '🗑️',
  ':link:': '🔗',
  ':computer:': '💻',
  ':globe:': '🌐',
  ':earth:': '🌍',
  ':house:': '🏠',
  ':car:': '🚗',
  ':airplane:': '✈️',
  ':hospital:': '🏥',
  ':school:': '🏫',
  ':factory:': '🏭',
  ':bank:': '🏦',
  ':hotel:': '🏨',
  ':waving:': '👋',
  ':thumbsup:': '👍',
  ':clap:': '👏',
  ':pray:': '🙏',
  ':eyes:': '👀',
  ':brain:': '🧠',
  ':muscle:': '💪',
  ':walking:': '🚶',
  ':running:': '🏃',
  ':swim:': '🏊',
  ':bike:': '🚴',
  ':tennis:': '🎾',
  ':soccer:': '⚽',
  ':basketball:': '🏀',
  ':coffee:': '☕',
  ':beer:': '🍺',
  ':pizza:': '🍕',
  ':apple:': '🍎',
  ':banana:': '🍌',
  ':cake:': '🎂',
  ':dog:': '🐕',
  ':cat:': '🐱',
  ':fish:': '🐟',
  ':bird:': '🐦',
  ':tree:': '🌳',
  ':flower:': '🌸',
  ':rose:': '🌹',
  ':tulip:': '🌷',
  ':sunflower:': '🌻',
  ':maple:': '🍁',
  ':snowflake:': '❄️',
  ':umbrella:': '☂️',
  ':rainbow:': '🌈',
  ':mountain:': '⛰️',
  ':beach:': '🏖️',
  ':camping:': '⛺',
}

/**
 * 将 emoji 快捷方式转换为实际 emoji
 */
function convertEmojiShortcodes(text: string): string {
  let result = text
  for (const [shortcode, emoji] of Object.entries(emojiMap)) {
    result = result.replace(new RegExp(shortcode, 'g'), emoji)
  }
  return result
}

// ID 计数器
let idCounter = 0

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `node-${++idCounter}`
}

/**
 * 将思维导图数据导出为 JSON
 */
export function exportToJSON(data: MindmapNode): string {
  return JSON.stringify(data, null, 2)
}

/**
 * 从 JSON 导入思维导图数据
 */
export function importFromJSON(json: string): MindmapNode | null {
  try {
    return JSON.parse(json)
  } catch (e) {
    console.error('JSON 解析失败:', e)
    return null
  }
}
