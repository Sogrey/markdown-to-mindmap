# Markdown 转思维导图 - 项目总评与开发建议

> 评审日期：2026-05-17
> 基于代码全量阅读 + 需求文档对照

---

## 一、项目总览

| 维度 | 状态 |
|------|------|
| 技术栈 | Vue 3 + Vite + CodeMirror 6 + Pinia + marked + 原生 SVG |
| 代码量 | ~2,630 行核心代码（6 个关键文件），7 个 Vue 组件 |
| 完成度 | v1.0 功能约 **85%** 完成，核心链路已跑通 |
| 可用性 | 可正常编辑 Markdown → 实时渲染思维导图 → 多格式导出 |

---

## 二、亮点（做得好的部分）

### 1. 架构思路清晰
编辑器 → 解析器 → 布局引擎 → SVG 渲染 → 导出器的流水线架构，职责分离合理。需求文档中的架构图与实际代码结构基本吻合。

### 2. 自研 SVG 渲染层
没有依赖第三方思维导图库（如 markmap、mind-elixir），完全自研 SVG 渲染。这意味着：
- 对节点样式、交互行为有完全控制权
- 未来扩展（拖拽排序、富文本、鱼骨图等）不受第三方库约束
- 代码量可控，没有引入沉重的依赖

### 3. 布局算法质量不错
水平/垂直两种布局都实现了父子居中对齐 + 子树垂直居中分布，贝塞尔曲线连线美观。折叠功能与布局联动正确。

### 4. 交互细节到位
- 鼠标滚轮以光标位置为中心缩放（而非页面中心）
- 拖拽/点击区分（5px 阈值），避免平移时误触发节点操作
- 右键菜单根据节点类型动态显示（根节点不可删除、叶节点无折叠选项）
- 双击编辑节点，ESC 取消，Enter 确认

### 5. 导出方案完整
PNG（2x Canvas 高清）+ SVG（foreignObject 保留样式）+ JSON + Markdown 四种格式，SVG 导出还做了坐标偏移修正和 CSS 变量内联。

---

## 三、问题与风险（需优先修复）

### 🔴 P0 - 功能性缺陷

#### 3.1 节点编辑写回 Markdown 依赖文本匹配，不可靠
**位置**：`App.vue:141-163` `handleEditNode()`

```typescript
// 当前实现：遍历 markdown 行，按文本匹配找节点
for (let i = 0; i < lines.length; i++) {
  const text = line.replace(/^#+\s*/, '').trim()
  const node = findNodeByText(treeData.value, text, nodeId)
  if (node) {
    lines[i] = '#'.repeat(level) + ' ' + newText
  }
}
```

**问题**：如果同一层级有两个相同文本的节点（如两个 "测试"），永远只能匹配到第一个。

**建议**：在 MindmapNode 中增加 `lineIndex` 字段，解析时记录每个节点对应 Markdown 的行号，编辑时直接按行号定位修改。

#### 3.2 备注数据未持久化，刷新即丢失
**位置**：`MindMap.vue:275` `nodeNotes` 是组件内 `ref<Record<string, string>>({})`

备注只存在于组件的响应式变量中，页面刷新、Markdown 重新解析都会丢失。Pinia store 里完全没有备注字段。

**建议**：
- 短期：将备注同步到 Pinia store + localStorage
- 长期：在 Markdown 中用 HTML 注释 `<!-- note: xxx -->` 或引用块 `> 备注` 存储备注

#### 3.3 `index.html` 引用 `main.js` 但实际是 `main.ts`
**位置**：`index.html:12`

```html
<script type="module" src="/src/main.js"></script>
```

Vite 开发时能正确处理，但这是一个不一致，可能在某些构建配置下出问题。

### 🟡 P1 - 架构/可维护性问题

#### 3.4 MindMap.vue 过于庞大（887 行）
这个组件承担了太多职责：
- SVG 渲染（节点 + 连线 + 备注）
- 交互逻辑（缩放/平移/拖拽检测/双击编辑）
- 右键菜单
- 备注弹窗
- 缩放提示 UI

需求文档规划了 `MindMapNode.vue` 和 `MindMapLine.vue` 两个子组件，但未拆分。

**建议拆分**：
- `MindMap.vue` - 容器层，管理缩放/平移/viewBox
- `MindMapNode.vue` - 单个节点渲染（rect + text + 折叠按钮 + 添加按钮）
- `MindMapLine.vue` - 连线渲染
- `NoteModal.vue` - 备注弹窗（从 MindMap 中抽出）

#### 3.5 App.vue 逻辑过重（550 行）
App.vue 直接管理了节点增删改的 Markdown 操作，这些逻辑应该提取为 composable：
- `useNodeOperations.ts` - 节点增删改逻辑
- `useExport.ts` - 导出逻辑

`composables/` 目录目前是空的，与规划不符。

#### 3.6 布局计算无防抖，高频触发
**位置**：`MindMap.vue:278` `layout` 是 computed 属性

每次 Markdown 内容变化都触发 `calculateLayout()` 重新计算全部节点坐标，无 debounce。对于 500+ 节点场景，这会造成卡顿。

**建议**：用 `watchDebounced` 或 `useDebounceFn` 包裹，延迟 100-200ms 计算布局。

### 🟢 P2 - 体验/细节问题

#### 3.7 解析器只支持标题语法，不支持列表语法
需求文档 5.3 节规划了列表格式：
```markdown
# 中心主题
- 分支一
  - 子节点1
  - 子节点2
```
但 `parser.ts` 只过滤 `heading` token，忽略列表。这是 v1.0 的遗漏。

#### 3.8 ID 生成器用模块级计数器，HMR 会冲突
**位置**：`parser.ts:144` `let idCounter = 0`

Vite HMR 时模块级变量不会重置，导致 ID 持续递增。虽然不影响功能，但调试时不直观。

**建议**：使用 `Date.now() + Math.random()` 或 `crypto.randomUUID()` 生成 ID。

#### 3.9 垂直布局子树宽度计算有潜在问题
`calculateVerticalLayout` 中子节点居中对齐依赖 `calculateNodeWidth(child.text)` 计算单个子节点宽度，但未考虑子节点自身子树的宽度。当深层嵌套时，子树可能重叠。

#### 3.10 "专业"主题节点背景深色但容器背景浅色
专业主题节点 `#1f2937` 深色背景，但思维导图容器背景是 `#fafafa` 浅色，视觉上割裂。建议主题切换时同步修改容器背景色。

#### 3.11 缺少初始自动居中
首次渲染思维导图时，视图未自动居中到根节点，用户可能需要手动拖动才能看到内容。

---

## 四、v1.0 遗漏项（需求文档 vs 实际代码对照）

| 需求 | 计划阶段 | 实际状态 | 说明 |
|------|---------|---------|------|
| Markdown 语法示例面板 | v1.0 | ❌ 未实现 | 无帮助/示例入口 |
| 快捷键提示 | v1.0 | ❌ 未实现 | 无快捷键说明 |
| 节点拖拽调整位置 | v1.0 | ❌ 未实现 | 只支持画布平移 |
| 列表格式解析 | v1.0 | ❌ 未实现 | 仅支持标题格式 |
| 自动保存/本地存储 | v2.0 | ❌ 未实现 | 刷新丢失所有数据 |
| 布局方向切换 UI | v1.0 | ⚠️ 部分 | store 有逻辑但 Toolbar 无按钮 |

---

## 五、后续开发建议（按优先级排序）

### 第一批：补齐 v1.0（1-2 天）

| # | 任务 | 预估 | 说明 |
|---|------|------|------|
| 1 | **修复节点编辑写回** | 2h | 增加 `lineIndex` 字段，按行号定位 |
| 2 | **备注持久化** | 2h | 同步到 Pinia + localStorage |
| 3 | **添加布局方向切换按钮** | 0.5h | Toolbar 加个方向切换按钮，调用 `store.toggleLayoutDirection()` |
| 4 | **初始视图自动居中** | 1h | 首次渲染后计算根节点位置，设置 panOffset 使其居中 |
| 5 | **修复 index.html 引用** | 5min | `main.js` → `main.ts` |

### 第二批：架构优化（2-3 天）

| # | 任务 | 预估 | 说明 |
|---|------|------|------|
| 6 | **拆分 MindMap.vue** | 4h | 抽出 MindMapNode / MindMapLine / NoteModal |
| 7 | **提取 App.vue 逻辑到 composables** | 3h | useNodeOperations / useExport |
| 8 | **布局计算防抖** | 1h | watchDebounced 包裹 calculateLayout |
| 9 | **列表格式解析** | 3h | marked 提取 list token，与 heading 混合构建树 |
| 10 | **主题同步容器背景** | 1h | 应用主题时同时修改 `.mindmap-container` 背景 |

### 第三批：v2.0 功能增强（3-5 天）

| # | 任务 | 预估 | 说明 |
|---|------|------|------|
| 11 | **本地自动保存** | 2h | localStorage 定时存储 + 恢复 |
| 12 | **节点拖拽排序** | 4h | SVG 拖拽 + Markdown 顺序同步 |
| 13 | **JSON 导入** | 1h | 已有 `importFromJSON`，缺 UI 入口 |
| 14 | **自定义主题编辑器** | 4h | 颜色选择器 + 预览 + 导出/导入 |
| 15 | **示例模板面板** | 2h | 3-5 个预设模板，一键加载 |
| 16 | **大纲视图** | 3h | 侧边栏树形大纲，点击跳转 |

### 第四批：v3.0 差异化（长期）

| # | 任务 | 说明 |
|---|------|------|
| 17 | **放射状布局** | 根节点居中，子节点环绕 |
| 18 | **节点富文本** | 加粗、斜体、链接、代码块渲染 |
| 19 | **AI 辅助生成** | 接入 LLM，根据主题自动补全子节点 |
| 20 | **PWA 离线支持** | Service Worker + 本地文件管理 |
| 21 | **大图虚拟渲染** | 500+ 节点时只渲染可视区域节点 |

---

## 六、代码规范建议

1. **统一文件组织**：`composables/` 目前为空，应按规划使用；或将 `utils/` 重命名为与规划一致
2. **增加 ESLint + Prettier**：当前无代码格式化配置，团队协作时必要
3. **添加 Vitest 测试**：至少为 `parser.ts` 和 `layout.ts` 添加单元测试，这两个是纯函数，测试成本低
4. **TypeScript 严格化**：`nodeInputRef` 类型应修正为 `HTMLInputElement | null` 而非数组
5. **Markdown 编辑器主题联动**：CodeMirror 当前固定使用 `oneDark`，切换到 "专业" 主题时应同步编辑器配色

---

## 七、总体评价

**一句话**：核心链路跑通了，交互细节用心，但架构上欠了一笔"拆分债"，几个数据可靠性问题需要先修。

这个项目是一个典型的"先跑通再优化"的开发节奏，v1.0 阶段这样没问题。但当前如果不做架构拆分就继续堆功能，MindMap.vue 会膨胀到难以维护。建议在进入 v2.0 之前，先完成第二批的架构优化，尤其是组件拆分和 composables 提取。

自研 SVG 渲染层是最有价值的决策，虽然前期工作量大，但为后续差异化功能（拖拽排序、放射布局、AI 生成）打下了好基础。继续保持这个方向，比换用第三方库更有长期价值。
