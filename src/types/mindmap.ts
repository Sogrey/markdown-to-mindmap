/**
 * 思维导图类型定义
 */

// 思维导图节点
export interface MindmapNode {
  id: string
  text: string
  level: number
  children: MindmapNode[]
  note?: string // 备注
}

// 布局节点（包含位置信息）
export interface LayoutNode {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  isRoot: boolean
  note?: string // 备注
  showNote?: boolean // 是否显示备注
  collapsed?: boolean // 是否折叠
}

// 连线数据
export interface LineData {
  from: LayoutNode
  to: LayoutNode
}

// 布局结果
export interface LayoutResult {
  nodes: LayoutNode[]
  lines: LineData[]
  width: number
  height: number
}

// 布局方向
export type LayoutDirection = 'horizontal' | 'vertical'

// 主题类型
export type ThemeId = 'classic' | 'professional' | 'playful'

// 主题配置
export interface ThemeConfig {
  id: ThemeId
  name: string
  bg: string
  border: string
  text: string
}

// 主题变量
export interface ThemeVariables {
  '--node-bg': string
  '--node-border': string
  '--node-text': string
  '--line-color': string
  '--root-bg': string
  '--root-text': string
}

// 导出类型
export type ExportType = 'png' | 'svg' | 'json' | 'markdown'

// 右键菜单操作类型
export type ContextMenuAction =
  | 'edit'
  | 'addChild'
  | 'toggleCollapse'
  | 'delete'
  | 'addNote'
  | 'toggleNote'
  | 'divider'

// 右键菜单项
export interface ContextMenuItem {
  action: ContextMenuAction
  label: string
  icon: string
  disabled?: boolean
  divider?: boolean
}

// 右键菜单位置
export interface ContextMenuPosition {
  x: number
  y: number
}
