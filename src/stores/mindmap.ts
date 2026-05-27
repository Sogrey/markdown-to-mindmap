/**
 * 思维导图状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeId, ThemeVariables } from '@/types/mindmap'

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

  // 当前主题
  const currentTheme = ref<ThemeId>('classic')

  // 缩放级别
  const zoomLevel = ref<number>(1)

  // ============ 方法 ============

  // 更新 Markdown 内容
  function updateMarkdown(content: string): void {
    markdownContent.value = content
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
        '--bg-color': '#f8fafc',
        '--panel-bg': '#ffffff',
        '--header-bg': '#f1f5f9',
        '--border-color': '#e2e8f0',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--hover-bg': '#e2e8f0',
        '--node-bg': '#ffffff',
        '--node-border': '#e2e8f0',
        '--node-text': '#1e293b',
        '--root-bg': '#3b82f6',
        '--root-text': '#ffffff',
      },
      dark: {
        '--bg-color': '#0f172a',
        '--panel-bg': '#1e293b',
        '--header-bg': '#334155',
        '--border-color': '#475569',
        '--text-primary': '#f1f5f9',
        '--text-secondary': '#94a3b8',
        '--hover-bg': '#334155',
        '--node-bg': '#1e293b',
        '--node-border': '#475569',
        '--node-text': '#f1f5f9',
        '--root-bg': '#3b82f6',
        '--root-text': '#ffffff',
      },
      colorful: {
        '--bg-color': '#fff7ed',
        '--panel-bg': '#ffffff',
        '--header-bg': '#ffedd5',
        '--border-color': '#fed7aa',
        '--text-primary': '#7c2d12',
        '--text-secondary': '#c2410c',
        '--hover-bg': '#ffedd5',
        '--node-bg': '#ffffff',
        '--node-border': '#fdba74',
        '--node-text': '#7c2d12',
        '--root-bg': '#f97316',
        '--root-text': '#ffffff',
      },
    }

    const themeVars = themes[theme]
    if (themeVars) {
      Object.entries(themeVars).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }

    // 设置 data-theme 属性
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
  }

  // 设置缩放级别
  function setZoomLevel(level: number): void {
    zoomLevel.value = Math.max(0.1, Math.min(5, level))
  }

  // 初始化主题
  function initTheme(): void {
    applyTheme(currentTheme.value)
  }

  return {
    // 状态
    markdownContent,
    currentTheme,
    zoomLevel,

    // 方法
    updateMarkdown,
    setTheme,
    setZoomLevel,
    initTheme,
  }
})
