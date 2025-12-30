# TJAD 服务建议书排版助手

这是一个用于建筑项目展示和建议书排版的Web应用程序。它允许用户选择不同的建筑项目，查看项目详情、照片，并以多种预设模板格式（文本、汇报、展板）进行预览和导出。

## 功能特性

- **项目选择与展示**: 从预设的项目列表中选择建筑项目，并查看其详细信息。
- **属性筛选**: 根据项目类型、建筑面积、高度、设计时间、工程造价、合作单位、建设地点和获奖名称等属性进行筛选。
- **项目照片**: 动态加载和展示所选项目的相关照片。
- **多格式模板预览**: 支持文本格式、汇报格式和展板格式的模板预览，用户可以根据需求切换。
- **多语言支持**: 提供中英文切换功能。
- **页面缩放**: 调整预览页面的缩放比例。
- **单页下载**: 将当前预览页面下载为图片（PNG）。
- **预存功能**: 将选定的页面预存起来，方便后续批量处理。
- **预存空间管理**: 查看、管理预存的页面，并支持清空所有预存。
- **批量导出**: 将预存的多个页面批量导出为 HTML、PPT 或 PDF 格式。
- **拖放功能**: 支持图片拖放，方便用户自定义布局。

## 技术栈

- **前端**: HTML, CSS, JavaScript
  - `html2canvas`: 用于将HTML内容渲染为图片。
  - `pptxgenjs`: 用于生成PPT文件。
  - `jspdf`: 用于生成PDF文件。
- **后端**: Node.js (作为静态文件服务器)

## 项目结构

```
.
├── README.md                       # 项目说明文件
├── building_data_en.csv            # 英文项目数据
├── building_data.csv               # 中文项目数据
├── index.html                      # 主应用页面
├── LOGO.svg                        # 应用Logo
├── server.js                       # Node.js 静态文件服务器
├── 启动应用(无需安装).bat          # Windows 启动脚本
├── 启动Chrome无安全模式.bat        # Windows 启动Chrome无安全模式脚本
├── css/                            # 样式文件
│   ├── main.css
│   ├── templates_display.css
│   ├── templates_document.css
│   └── templates_presentation.css
├── img/                            # 项目图片资源
│   ├── [项目名称]/                 # 各项目图片文件夹
│   └── ...
├── js/                             # JavaScript 脚本
│   ├── data-loader.js              # 数据加载与处理
│   ├── drag-drop.js                # 拖放功能实现
│   ├── main.js                     # 主逻辑控制
│   ├── preset-manager.js           # 预存功能管理
│   └── template-manager.js         # 模板管理
├── templates/                      # HTML 模板文件
│   ├── 01 document/                # 文档格式模板
│   ├── 02 presentation/            # 汇报格式模板
│   └── 03 display/                 # 展板格式模板
└── thumbnail/                      # 模板缩略图
    ├── 01 document/
    ├── 02 presentation/
    └── 03 display/
```

## 快速开始

1.  **克隆仓库**:
    ```bash
    git clone https://github.com/your-username/Service-Proposal-Formatting-Assistant.git
    cd Service-Proposal-Formatting-Assistant
    ```

2.  **启动服务器**:
    -   **Windows**: 双击运行 `启动应用(无需安装).bat`。
    -   **其他系统 (或手动启动)**:
        ```bash
        node server.js
        ```
    服务器将在 `http://localhost:8080` 启动，并自动在浏览器中打开 `index.html`。

3.  **使用应用**:
    -   在左侧面板选择一个项目。
    -   选择需要展示的属性和照片。
    -   在右侧预览区域选择不同的模板格式和具体模板。
    -   使用下载、预存和导出功能。

## 开发

### 数据结构

项目数据存储在 `building_data.csv` (中文) 和 `building_data_en.csv` (英文) 文件中。这些文件包含项目的各种属性，如项目名称、类型、面积、高度等。

### 模板定制

模板文件位于 `templates/` 目录下，分为 `01 document` (文本), `02 presentation` (汇报), `03 display` (展板) 三种格式。你可以通过修改这些HTML文件来定制模板的布局和样式。

### 样式

CSS 文件位于 `css/` 目录下，用于控制应用的整体布局和模板样式。

## 贡献

欢迎提交 Issue 或 Pull Request 来改进此项目。

## 许可证

[待定，如果需要，请在此处添加许可证信息]
