# Markdown 转思维导图

> 将结构化 Markdown 实时转换为可交互的 SVG 思维导图

一个基于 Vue 3 的纯前端工具，在左侧编辑 Markdown 标题层级，右侧即刻生成可缩放、可拖拽的思维导图。

## 特性

- **实时解析** — Markdown 变化即刻映射到导图
- **交互操作** — 画布平移/缩放、节点折叠/展开、单击选中
- **多主题** — 经典（蓝）、暗黑、专业（深色）、活泼（黄）四套配色
- **多格式导出** — PNG（2x 高清）、SVG、JSON、Markdown
- **暗色编辑器** — CodeMirror 6 + One Dark 主题
- **可折叠面板** — 收起左侧编辑器，全屏查看思维导图

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript 6 |
| 构建 | Vite 8 |
| 状态管理 | Pinia 3 |
| 编辑器 | CodeMirror 6（Markdown 语言 + One Dark 主题） |
| 思维导图渲染 | markmap-view + markmap-lib |
| 样式 | 原生 CSS 变量 + 主题系统 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 构建生产包
pnpm build

# 预览构建产物
pnpm preview
```

## 使用方法

1. 在左侧编辑器中使用 Markdown 标题语法（`#` ~ `######`）编写层级内容
2. 右侧画布实时渲染思维导图
3. 支持的操作：
   - **滚轮缩放** / **拖拽平移** 画布
   - **单击节点** 选中
   - 工具栏切换主题、调整缩放、导出文件
   - 点击左侧面板折叠按钮收起编辑器，全屏查看导图

## Markdown 语法示例

```markdown
# 项目概览

## 前端

### Vue 3 组件

### Vite 构建优化

## 后端

### API 设计

### 数据库
```

## 项目结构

```
src/
├── main.ts                          # 应用入口
├── App.vue                          # 根组件（双栏布局 + 状态管理）
├── style.css                        # 全局样式
├── components/
│   ├── editor/
│   │   └── MarkdownEditor.vue       # CodeMirror 6 编辑器封装
│   ├── mindmap/
│   │   └── MarkmapView.vue          # markmap 思维导图渲染器
│   ├── toolbar/
│   │   └── Toolbar.vue              # 工具栏（主题 + 缩放 + 导出）
│   └── theme/
│       └── ThemeSelector.vue        # 主题选择器
├── stores/
│   └── mindmap.ts                   # Pinia 全局状态（主题、缩放）
├── types/
│   └── mindmap.ts                   # TypeScript 类型定义
└── utils/
    └── export.ts                    # PNG/SVG/JSON/Markdown 导出
```

## 主题

提供三套主题：

| 主题 | 名称 | 说明 |
|------|------|------|
| classic | 经典 | 蓝色系，适合明亮环境 |
| dark | 暗黑 | 深色系，适合夜间使用 |
| colorful | 活泼 | 橙黄色系，视觉更丰富 |

## 导出格式

| 格式 | 说明 |
|------|------|
| PNG | 2x 高清图片，白色背景 |
| SVG | 矢量图形，可无损缩放 |
| JSON | 包含 Markdown 原文和导出时间 |
| Markdown | 原始 Markdown 文件 |

## License

MIT
