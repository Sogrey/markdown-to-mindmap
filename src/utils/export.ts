/**
 * 导出功能
 */

/**
 * 导出为 PNG 图片
 */
export async function exportToPNG(svgElement: SVGSVGElement | null): Promise<void> {
  if (!svgElement) return

  // 克隆 SVG 元素以避免修改原始元素
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

  // 获取 SVG 的实际尺寸
  const rect = svgElement.getBoundingClientRect()
  const width = rect.width || 800
  const height = rect.height || 600

  // 设置克隆 SVG 的宽高
  clonedSvg.setAttribute('width', String(width))
  clonedSvg.setAttribute('height', String(height))
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // 添加白色背景
  const rectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rectElement.setAttribute('width', '100%')
  rectElement.setAttribute('height', '100%')
  rectElement.setAttribute('fill', 'white')
  clonedSvg.insertBefore(rectElement, clonedSvg.firstChild)

  // 序列化 SVG
  const svgData = new XMLSerializer().serializeToString(clonedSvg)

  // 创建 canvas
  const canvas = document.createElement('canvas')
  const scale = 2 // 高清导出
  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 填充白色背景
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 创建图片
  const img = new Image()

  // 使用 Base64 编码避免跨域问题
  const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = reject
    img.src = svgBase64
  })

  // 导出 PNG
  const pngUrl = canvas.toDataURL('image/png')
  downloadFile(pngUrl, 'mindmap.png')
}

/**
 * 导出为 SVG
 */
export async function exportToSVG(svgElement: SVGSVGElement | null): Promise<void> {
  if (!svgElement) return

  // 克隆 SVG 元素
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

  // 获取实际尺寸
  const rect = svgElement.getBoundingClientRect()
  clonedSvg.setAttribute('width', String(rect.width || 800))
  clonedSvg.setAttribute('height', String(rect.height || 600))
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const svgData = new XMLSerializer().serializeToString(clonedSvg)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  downloadFile(url, 'mindmap.svg')
}

/**
 * 导出为 JSON
 */
export function exportToJSON(markdown: string): void {
  const data = {
    markdown,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  downloadFile(url, 'mindmap.json')
}

/**
 * 导出为 Markdown
 */
export function exportToMarkdown(markdown: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  downloadFile(url, 'mindmap.md')
}

/**
 * 下载文件
 */
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
