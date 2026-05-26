# Markdown 转思维导图

> 将结构化 Markdown 实时转换为可交互的 SVG 思维导图

一个基于 Vue 3 的纯前端工具，在左侧编辑 Markdown 标题层级，右侧即刻生成可缩放、可拖拽、可编辑的思维导图。

## 特性

- **实时解析** — 基于 marked 分词，Markdown 变化即刻映射到导图
- **交互操作** — 画布平移/缩放、节点折叠/展开、双击编辑、右键菜单
- **双向同步** — 在导图上增删改节点，Markdown 源文自动更新
- **多主题** — 经典（蓝）、专业（深色）、活泼（黄）三套配色
- **双布局** — 支持水平（左→右）和垂直（上→下）两种布局方向
- **多格式导出** — PNG（2x 高清）、SVG、JSON、Markdown
- **Emoji 快捷码** — 输入 `:star:`、`:bulb:` 等 80+ 短码自动转 emoji
- **暗色编辑器** — CodeMirror 6 + One Dark 主题

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript 6 |
| 构建 | Vite 8 |
| 状态管理 | Pinia 3 |
| 编辑器 | CodeMirror 6（Markdown 语言 + One Dark 主题） |
| 解析 | marked 18 |
| 渲染 | 自定义 SVG 布局引擎（无第三方导图库依赖） |

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
   - **单击** 选中节点，**双击** 进入编辑
   - **右键** 打开上下文菜单（添加子节点、编辑、折叠、删除、备注）
   - **点击 +/- 按钮** 折叠/展开子节点
   - 工具栏切换主题、调整缩放、导出文件

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

> 目前仅支持标题（heading）语法，列表（list）格式尚未支持。

## 项目结构

```
src/
├── main.ts                          # 应用入口
├── App.vue                          # 根组件（双栏布局 + 节点 CRUD）
├── components/
│   ├── editor/
│   │   └── MarkdownEditor.vue       # CodeMirror 6 编辑器封装
│   ├── mindmap/
│   │   ├── MindMap.vue              # SVG 思维导图渲染器（核心）
│   │   └── ContextMenu.vue          # 右键菜单
│   ├── toolbar/
│   │   └── Toolbar.vue              # 工具栏（缩放 + 导出）
│   └── theme/
│       └── ThemeSelector.vue        # 主题选择器
├── stores/
│   └── mindmap.ts                   # Pinia 全局状态
├── types/
│   └── mindmap.ts                   # TypeScript 类型定义
└── utils/
    ├── parser.ts                    # Markdown → 树结构解析器
    ├── layout.ts                    # 树结构 → XY 坐标布局引擎
    └── export.ts                    # PNG/SVG/JSON/Markdown 导出
```

## 核心算法

### Markdown 解析

使用 marked 库分词，提取标题（h1-h6）token，通过栈结构 O(n) 构建树：

```
# H1          → root
## H2         → root.children[0]
### H3        → root.children[0].children[0]
## H2         → root.children[1]  (H3 从栈中弹出)
```

### 布局引擎

- **水平布局**：根节点居左，子节点向右展开，兄弟节点垂直居中于父节点
- **垂直布局**：根节点居上，子节点向下展开
- 节点宽度根据中英文字符比例动态计算（中文 14px/字，英文 8.4px/字）
- 折叠节点隐藏后代但不影响空间预留

## 已知限制

| 项目 | 说明 |
|------|------|
| 仅支持标题语法 | Markdown 列表格式暂未支持 |
| 节点编辑依赖文本匹配 | 同级同名节点可能匹配错误 |
| 备注不持久化 | 刷新页面后备注丢失 |
| MindMap.vue 体积较大 | 887 行，计划拆分为子组件 |
| 无布局防抖 | 500+ 节点时可能触发性能问题 |
| 布局方向切换无 UI | 功能已实现，但工具栏缺少切换按钮 |

## 文档

- [需求分析与方案设计](doc/需求分析与方案.md)
- [项目复盘与改进计划](doc/project-review.md)

## License

MIT
