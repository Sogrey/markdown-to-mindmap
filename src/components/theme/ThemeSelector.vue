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
    id: 'professional',
    name: '专业',
    bg: '#1f2937',
    border: '#6366f1',
    text: '#f9fafb',
  },
  {
    id: 'playful',
    name: '活泼',
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
  color: #666;
}

.theme-options {
  display: flex;
  gap: 8px;
}

.theme-btn {
  width: 48px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid var(--theme-border);
  background: var(--theme-bg);
  color: var(--theme-text);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.theme-btn.active {
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.theme-name {
  pointer-events: none;
}
</style>
