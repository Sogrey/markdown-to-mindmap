# 工作记忆

## 项目：Markdown 转思维导图工具

### 技术栈
- Vue 3 + Vite + TypeScript
- Pinia 状态管理
- SVG 渲染思维导图

### 核心文件
- `src/utils/parser.ts` - Markdown 解析器，支持 `> 备注` 语法
- `src/utils/export.ts` - 导出工具（PNG/SVG/JSON/Markdown）
- `src/utils/layout.ts` - 思维导图布局算法
- `src/components/mindmap/MindMap.vue` - SVG 渲染组件

### 备注功能
- **Markdown 语法**: `## 标题 > 备注内容`
- 备注解析：parser.ts 中 parseNodeText() 函数提取 `>` 后面的内容
- Markdown 导出：exportToMarkdown() 自动添加 `> 备注` 后缀
- JSON 存储：MindmapNode.note 字段

### 导出功能
- PNG: 使用 Canvas，foreignObject 转为 SVG text
- SVG: 移除 viewBox，内容平移到原点
- JSON: 完整树结构含备注
- Markdown: 标题层级 + `> 备注` 语法

### 更新记录
- 2026-05-18: 实现 Markdown 备注语法 `> 备注`
