<template>
  <div class="markdown-editor" ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorContainer = ref<HTMLDivElement | null>(null)
let editorView: EditorView | null = null
const themeCompartment = new Compartment()

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorView && editorView.state.doc.toString() !== newValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newValue,
        },
      })
    }
  }
)

onMounted(() => {
  if (!editorContainer.value) return

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      markdown(),
      themeCompartment.of(oneDark),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString()
          emit('update:modelValue', content)
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
        },
        '.cm-content': {
          fontFamily: "'Fira Code', 'Consolas', monospace",
          padding: '16px',
        },
        '.cm-gutters': {
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid #333',
        },
        '.cm-activeLineGutter': {
          backgroundColor: '#2d2d2d',
        },
        '.cm-scroller': {
          overflow: 'auto',
        },
      }),
    ],
  })

  editorView = new EditorView({
    state: startState,
    parent: editorContainer.value,
  })
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
  }
})

// 暴露编辑器实例
defineExpose({
  editorView,
})
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.markdown-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
