import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useMindmapStore } from './stores/mindmap'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 初始化主题
const store = useMindmapStore()
store.initTheme()

app.mount('#app')
