/**
 * 导出工具
 * 支持 PNG、SVG、JSON、Markdown 格式导出
 */

import type { MindmapNode } from '@/types/mindmap'

/**
 * 获取当前主题的 CSS 变量值
 */
function getThemeColors(): Record<string, string> {
  const root = document.documentElement
  return {
    nodeBg: getComputedStyle(root).getPropertyValue('--node-bg').trim() || '#ffffff',
    nodeBorder: getComputedStyle(root).getPropertyValue('--node-border').trim() || '#3b82f6',
    nodeText: getComputedStyle(root).getPropertyValue('--node-text').trim() || '#1f2937',
    lineColor: getComputedStyle(root).getPropertyValue('--line-color').trim() || '#93c5fd',
    rootBg: getComputedStyle(root).getPropertyValue('--root-bg').trim() || '#3b82f6',
    rootText: getComputedStyle(root).getPropertyValue('--root-text').trim() || '#ffffff',
  }
}

/**
 * 计算内容边界（包含节点和连线）
 */
function calculateContentBounds(svgElement: SVGSVGElement): { minX: number; minY: number; maxX: number; maxY: number } {
  const nodeGroups = svgElement.querySelectorAll('.node-group')
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  // 收集节点边界
  nodeGroups.forEach((group) => {
    const transform = group.getAttribute('transform') || ''
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
    if (match) {
      const x = parseFloat(match[1])
      const y = parseFloat(match[2])
      const rect = group.querySelector('rect')
      const width = rect ? parseFloat(rect.getAttribute('width') || '100') : 100
      const height = rect ? parseFloat(rect.getAttribute('height') || '44') : 44

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
    }
  })

  // 收集连线边界
  const lines = svgElement.querySelectorAll('.connection-line')
  lines.forEach((line) => {
    const d = line.getAttribute('d') || ''
    const coords = parsePathCoords(d)
    coords.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
  })

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 }
  }

  return { minX, minY, maxX, maxY }
}

/**
 * 解析SVG路径坐标
 * 返回 [x, y] 坐标数组
 */
function parsePathCoords(d: string): [number, number][] {
  const coords: [number, number][] = []
  // 匹配所有数字
  const numbers = d.match(/-?\d+\.?\d*/g) || []
  // 每两个数字为一组坐标
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    coords.push([parseFloat(numbers[i]), parseFloat(numbers[i + 1])])
  }
  return coords
}

/**
 * 将 foreignObject 替换为 SVG text 元素（用于PNG导出）
 */
function replaceForeignObjectWithText(clone: SVGSVGElement): void {
  const foreignObjects = clone.querySelectorAll('foreignObject')

  foreignObjects.forEach((fo) => {
    const div = fo.querySelector('div')
    if (!div) return

    const text = div.textContent || ''
    const nodeGroup = fo.closest('.node-group')
    const isRoot = nodeGroup?.classList.contains('is-root')
    const colors = getThemeColors()

    // 获取节点尺寸
    const node = fo.closest('.node')
    const rect = node?.querySelector('rect')
    const width = rect ? parseFloat(rect.getAttribute('width') || '100') : 100
    const height = rect ? parseFloat(rect.getAttribute('height') || '44') : 44

    // 创建 text 元素
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    textEl.setAttribute('x', String(width / 2))
    textEl.setAttribute('y', String(height / 2))
    textEl.setAttribute('text-anchor', 'middle')
    textEl.setAttribute('dominant-baseline', 'middle')
    textEl.setAttribute('fill', isRoot ? colors.rootText : colors.nodeText)
    textEl.setAttribute('font-size', isRoot ? '15' : '13')
    textEl.setAttribute('font-weight', isRoot ? '600' : '400')
    textEl.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')

    // 处理文本换行
    const words = text.split('\n')
    const tspanCount = words.length
    const lineHeight = 1.3

    if (tspanCount === 1) {
      textEl.textContent = text
    } else {
      words.forEach((word, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
        tspan.setAttribute('x', String(width / 2))
        tspan.setAttribute('dy', i === 0 ? '0' : `${13 * lineHeight}px`)
        tspan.textContent = word
        textEl.appendChild(tspan)
      })
    }

    // 替换 foreignObject
    fo.parentNode?.replaceChild(textEl, fo)
  })
}

/**
 * 将 CSS 变量内联到 SVG 元素
 */
function applyInlineStyles(element: Element, colors: Record<string, string>): void {
  const lines = element.querySelectorAll('.connection-line')
  lines.forEach((line) => {
    line.setAttribute('stroke', colors.lineColor)
  })

  const nodes = element.querySelectorAll('.node')
  nodes.forEach((node) => {
    const rect = node.querySelector('rect')
    const isRoot = node.closest('.node-group')?.classList.contains('is-root')

    if (rect) {
      rect.setAttribute('fill', isRoot ? colors.rootBg : colors.nodeBg)
      rect.setAttribute('stroke', isRoot ? colors.rootBg : colors.nodeBorder)
    }
  })

  const arrows = element.querySelectorAll('polygon')
  arrows.forEach((arrow) => {
    arrow.setAttribute('fill', colors.lineColor)
  })
}

/**
 * 调整连线路径坐标
 * 解析路径中的所有坐标对，正确区分 x 和 y
 */
function adjustLineCoords(line: Element, offsetX: number, offsetY: number): void {
  const d = line.getAttribute('d') || ''
  if (!d) return

  // 提取所有数字及其位置
  const tokens: { value: number; isX: boolean }[] = []
  const regex = /(-?[\d.]+)/g
  let match
  let pairIndex = 0

  while ((match = regex.exec(d)) !== null) {
    const num = parseFloat(match[1])
    const isX = pairIndex % 2 === 0 // 偶数是 x，奇数是 y
    tokens.push({ value: num, isX })
    pairIndex++
  }

  if (tokens.length === 0) return

  // 替换数字
  let result = d
  let tokenIdx = 0

  result = result.replace(/(-?[\d.]+)/g, (_match) => {
    const token = tokens[tokenIdx]
    tokenIdx++
    if (token.isX) {
      return String(token.value - offsetX)
    } else {
      return String(token.value - offsetY)
    }
  })

  line.setAttribute('d', result)
}

/**
 * 准备导出的 SVG（调整坐标、样式等）
 */
function prepareExportSVG(svgElement: SVGSVGElement): { clone: SVGSVGElement; width: number; height: number } {
  const colors = getThemeColors()
  const clone = svgElement.cloneNode(true) as SVGSVGElement

  // 移除交互按钮
  clone.querySelectorAll('.add-btn, .collapse-btn').forEach((el) => el.remove())

  // 计算内容边界
  const bounds = calculateContentBounds(svgElement)
  const padding = 50
  const width = bounds.maxX - bounds.minX + padding * 2
  const height = bounds.maxY - bounds.minY + padding * 2

  // 平移所有节点到正确位置
  const nodeGroups = clone.querySelectorAll('.node-group')
  nodeGroups.forEach((group) => {
    const transform = group.getAttribute('transform') || ''
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
    if (match) {
      const x = parseFloat(match[1]) - bounds.minX + padding
      const y = parseFloat(match[2]) - bounds.minY + padding
      group.setAttribute('transform', `translate(${x}, ${y})`)
    }
  })

  // 调整连线路径
  const lines = clone.querySelectorAll('.connection-line')
  lines.forEach((line) => {
    adjustLineCoords(line, bounds.minX - padding, bounds.minY - padding)
  })

  applyInlineStyles(clone, colors)

  // 移除 viewBox 和 class
  clone.removeAttribute('viewBox')
  clone.removeAttribute('class')
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  return { clone, width, height }
}

/**
 * 导出为 PNG
 */
export async function exportToPNG(
  svgElement: SVGSVGElement,
  filename = 'mindmap'
): Promise<void> {
  const { clone, width, height } = prepareExportSVG(svgElement)

  // 关键：将 foreignObject 替换为 SVG text
  replaceForeignObjectWithText(clone)

  // 添加背景
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bgRect.setAttribute('width', '100%')
  bgRect.setAttribute('height', '100%')
  bgRect.setAttribute('fill', '#ffffff')
  clone.insertBefore(bgRect, clone.firstChild)

  // 添加字体样式
  const defs = clone.querySelector('defs')
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `
  if (defs && defs.parentNode) {
    defs.parentNode.insertBefore(style, defs.nextSibling)
  } else {
    clone.insertBefore(style, clone.firstChild)
  }

  const svgData = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    URL.revokeObjectURL(svgUrl)
    throw new Error('无法获取 Canvas 上下文')
  }
  ctx.scale(scale, scale)

  const img = new Image()

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      try {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${filename}.png`
            link.click()
            URL.revokeObjectURL(url)
          }
          URL.revokeObjectURL(svgUrl)
          resolve()
        }, 'image/png')
      } catch (err) {
        // Fallback: 下载 SVG
        const link = document.createElement('a')
        link.href = svgUrl
        link.download = `${filename}.svg`
        link.click()
        URL.revokeObjectURL(svgUrl)
        resolve()
      }
    }

    img.onerror = () => {
      // Fallback: 下载 SVG
      const link = document.createElement('a')
      link.href = svgUrl
      link.download = `${filename}.svg`
      link.click()
      URL.revokeObjectURL(svgUrl)
      resolve()
    }

    img.src = svgUrl
  })
}

/**
 * 导出为 SVG
 */
export function exportToSVG(
  svgElement: SVGSVGElement,
  filename = 'mindmap'
): void {
  const { clone } = prepareExportSVG(svgElement)
  const colors = getThemeColors()

  // 添加背景
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bgRect.setAttribute('width', '100%')
  bgRect.setAttribute('height', '100%')
  bgRect.setAttribute('fill', '#ffffff')
  clone.insertBefore(bgRect, clone.firstChild)

  // 处理 foreignObject 中的文字样式，确保垂直居中
  const foreignObjects = clone.querySelectorAll('foreignObject')
  foreignObjects.forEach((fo) => {
    const div = fo.querySelector('div')
    if (!div) return

    // 判断是否是根节点
    const nodeGroup = fo.closest('.node-group')
    const isRoot = nodeGroup?.classList.contains('is-root')
    const textColor = isRoot ? colors.rootText : colors.nodeText
    const fontSize = isRoot ? 15 : 13
    const fontWeight = isRoot ? '600' : '400'

    // 获取节点组中的rect来获取实际尺寸
    const rect = nodeGroup?.querySelector('rect')
    const nodeWidth = rect ? parseFloat(rect.getAttribute('width') || '100') : 100
    const nodeHeight = rect ? parseFloat(rect.getAttribute('height') || '44') : 44

    // 获取文字内容
    const text = div.textContent || ''

    // 创建新的foreignObject内容，替换原有div
    const newDiv = document.createElementNS('http://www.w3.org/2000/svg', 'div')
    newDiv.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
    newDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${nodeWidth - 16}px;
      height: ${nodeHeight}px;
      box-sizing: border-box;
      padding: 0 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      color: ${textColor};
      text-align: center;
      line-height: 1.3;
      word-break: break-word;
      overflow: hidden;
    `
    newDiv.textContent = text

    // 替换原有内容
    while (fo.firstChild) {
      fo.removeChild(fo.firstChild)
    }
    fo.appendChild(newDiv)

    // 确保foreignObject尺寸正确
    fo.setAttribute('width', String(nodeWidth - 16))
    fo.setAttribute('height', String(nodeHeight))
    fo.setAttribute('x', '8')
    fo.setAttribute('y', '0')
  })

  // 添加字体样式
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    foreignObject div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `
  clone.insertBefore(style, clone.firstChild)

  const svgData = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.svg`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 导出为 JSON
 */
export function exportToJSON(data: MindmapNode, filename = 'mindmap'): void {
  const jsonData = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonData], { type: 'application/json' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 导出为 Markdown
 * 使用标准格式：标题行 + 备注行（每行都有 > 前缀）
 */
export function exportToMarkdown(data: MindmapNode, filename = 'mindmap'): void {
  function nodeToMarkdown(node: MindmapNode, indent: number = 0): string {
    const prefix = '#'.repeat(node.level) + ' '
    const line = prefix + node.text
    const lines = [line]

    // 如果有备注，添加到下一行（标准格式）
    if (node.note) {
      // 添加空行
      lines.push('')
      
      // 每行备注都添加 > 前缀
      const noteLines = node.note.split('\n')
      noteLines.forEach((noteLine) => {
        lines.push('> ' + noteLine)
      })
    }

    if (node.children && node.children.length > 0) {
      // 如果有备注，子节点前加空行
      if (node.note) {
        lines.push('')
      }
      
      for (const child of node.children) {
        lines.push(nodeToMarkdown(child, indent + 1))
      }
    }

    return lines.join('\n')
  }

  const markdown = nodeToMarkdown(data)
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.md`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 从文件导入 JSON
 */
export function importFromJSON(file: File): Promise<MindmapNode> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch {
        reject(new Error('JSON 文件格式错误'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsText(file)
  })
}
