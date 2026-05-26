/**
 * 思维导图状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MindmapNode, LayoutDirection, ThemeId, ThemeVariables } from '@/types/mindmap'

// 默认 Markdown 内容
const DEFAULT_MARKDOWN = `# 思维导图标题

## 一级分支 1

### 二级节点 1.1

### 二级节点 1.2

## 一级分支 2

### 二级节点 2.1

### 二级节点 2.2

### 二级节点 2.3

## 一级分支 3

### 二级节点 3.1
`

export const useMindmapStore = defineStore('mindmap', () => {
  // ============ 状态 ============

  // Markdown 内容
  const markdownContent = ref<string>(DEFAULT_MARKDOWN)

  // 思维导图数据（树形结构）
  const mindmapData = ref<MindmapNode | null>(null)

  // 当前主题
  const currentTheme = ref<ThemeId>('classic')

  // 缩放级别
  const zoomLevel = ref<number>(1)

  // 画布偏移
  const panOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 })

  // 折叠的节点 ID 集合
  const collapsedNodes = ref<Set<string>>(new Set())

  // 布局方向
  const layoutDirection = ref<LayoutDirection>('horizontal')

  // ============ 计算属性 ============

  const isCollapsed = computed(() => (nodeId: string) => collapsedNodes.value.has(nodeId))

  // ============ 方法 ============

  // 更新 Markdown 内容
  function updateMarkdown(content: string): void {
    markdownContent.value = content
  }

  // 更新思维导图数据
  function updateMindmapData(data: MindmapNode | null): void {
    mindmapData.value = data
  }

  // 切换主题
  function setTheme(theme: ThemeId): void {
    currentTheme.value = theme
    applyTheme(theme)
  }

  // 应用主题
  function applyTheme(theme: ThemeId): void {
    const root = document.documentElement
    const themes: Record<ThemeId, ThemeVariables> = {
      classic: {
        '--node-bg': '#ffffff',
        '--node-border': '#3b82f6',
        '--node-text': '#1f2937',
        '--line-color': '#93c5fd',
        '--root-bg': '#3b82f6',
        '--root-text': '#ffffff',
      },
      professional: {
        '--node-bg': '#1f2937',
        '--node-border': '#6366f1',
        '--node-text': '#f9fafb',
        '--line-color': '#6366f1',
        '--root-bg': '#6366f1',
        '--root-text': '#ffffff',
      },
      playful: {
        '--node-bg': '#fef3c7',
        '--node-border': '#f59e0b',
        '--node-text': '#78350f',
        '--line-color': '#fcd34d',
        '--root-bg': '#f59e0b',
        '--root-text': '#ffffff',
      },
    }
    const t = themes[theme] || themes.classic
    Object.entries(t).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  // 切换节点折叠状态
  function toggleCollapse(nodeId: string): void {
    if (collapsedNodes.value.has(nodeId)) {
      collapsedNodes.value.delete(nodeId)
    } else {
      collapsedNodes.value.add(nodeId)
    }
  }

  // 设置缩放
  function setZoom(level: number): void {
    zoomLevel.value = Math.max(0.1, Math.min(3, level))
  }

  // 设置画布偏移
  function setPan(x: number, y: number): void {
    panOffset.value = { x, y }
  }

  // 重置视图
  function resetView(): void {
    zoomLevel.value = 1
    panOffset.value = { x: 0, y: 0 }
  }

  // 切换布局方向
  function toggleLayoutDirection(): void {
    layoutDirection.value = layoutDirection.value === 'horizontal' ? 'vertical' : 'horizontal'
  }

  return {
    // 状态
    markdownContent,
    mindmapData,
    currentTheme,
    zoomLevel,
    panOffset,
    collapsedNodes,
    layoutDirection,
    // 计算
    isCollapsed,
    // 方法
    updateMarkdown,
    updateMindmapData,
    setTheme,
    applyTheme,
    toggleCollapse,
    setZoom,
    setPan,
    resetView,
    toggleLayoutDirection,
  }
})
