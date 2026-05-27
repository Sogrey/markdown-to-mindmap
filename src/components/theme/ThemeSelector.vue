<template>
  <div class="theme-selector">
    <div class="theme-label">主题</div>
    <div class="theme-options">
      <button
        v-for="theme in themes"
        :key="theme.id"
        class="theme-btn"
        :class="{ active: currentTheme === theme.id }"
        :style="getThemeStyle(theme)"
        @click="selectTheme(theme.id)"
      >
        <span class="theme-name">{{ theme.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMindmapStore } from '../../stores/mindmap'
import type { ThemeId, ThemeConfig } from '@/types/mindmap'

const store = useMindmapStore()

const themes: ThemeConfig[] = [
  {
    id: 'classic',
    name: '经典',
    bg: '#ffffff',
    border: '#3b82f6',
    text: '#1f2937',
  },
  {
    id: 'dark',
    name: '暗黑',
    bg: '#1f2937',
    border: '#6366f1',
    text: '#f9fafb',
  },
  {
    id: 'colorful',
    name: '彩色',
    bg: '#fef3c7',
    border: '#f59e0b',
    text: '#78350f',
  },
]

const currentTheme = computed<ThemeId>(() => store.currentTheme)

function getThemeStyle(theme: ThemeConfig): Record<string, string> {
  return {
    '--theme-bg': theme.bg,
    '--theme-border': theme.border,
    '--theme-text': theme.text,
  }
}

function selectTheme(themeId: ThemeId): void {
  store.setTheme(themeId)
}
</script>

<style scoped>
.theme-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.theme-options {
  display: flex;
  gap: 8px;
}

.theme-btn {
  padding: 6px 12px;
  border: 2px solid var(--theme-border);
  border-radius: 6px;
  background: var(--theme-bg);
  color: var(--theme-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.theme-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-btn.active {
  box-shadow: 0 0 0 2px var(--theme-border);
}

.theme-name {
  white-space: nowrap;
}
</style>
