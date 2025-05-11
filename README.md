# XX 智能体对话应用

这是一个基于 Vue 3 和 Vite 构建的移动端智能体对话应用前端演示项目。该应用提供了智能聊天、语音朗读、网页搜索结果展示等功能。

## 项目介绍

本项目是一个移动端智能对话应用，具有以下特点：

- 基于 Vue 3 和 Vite 构建
- 使用 Vant UI 组件库实现移动端友好的界面
- 支持聊天列表和聊天详情页面
- 支持语音朗读功能
- 支持网页搜索结果展示
- 支持视频引用和搜索引用

## 环境要求

- Node.js 16.0 或更高版本
- pnpm 7.0 或更高版本

## 安装与运行

### 安装依赖

```bash
pnpm install
```

### 开发模式运行

```bash
pnpm dev
```

启动后，访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
pnpm build
```

构建完成后，生成的文件将位于 `dist` 目录中，可以部署到任何静态文件服务器。

## 项目结构

```
app-ai/
├── public/              # 静态资源目录
├── src/                 # 源代码目录
│   ├── api/             # API 接口
│   ├── assets/          # 资源文件
│   ├── components/      # 公共组件
│   ├── http/            # HTTP 请求配置
│   ├── router/          # 路由配置
│   ├── store/           # 状态管理
│   ├── utils/           # 工具函数
│   ├── views/           # 页面组件
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
└── package.json         # 项目配置
```

## 主要功能

### 聊天列表

显示所有聊天会话，支持创建新的聊天会话。

### 聊天详情

- 支持发送和接收消息
- 支持语音朗读功能
- 支持搜索结果引用
- 支持视频引用

### 搜索结果展示

- 支持展示搜索结果列表
- 支持查看搜索结果详情
- 支持通过 iframe 嵌入显示网页内容

## 开发指南

### 添加新组件

在 `src/components` 目录下创建新的 `.vue` 文件。

### 添加新页面

1. 在 `src/views` 目录下创建新的 `.vue` 文件
2. 在 `src/router/index.js` 中添加对应的路由配置

### 修改样式

全局样式在 `src/App.vue` 和 `src/style.css` 中定义，组件特定样式在各组件的 `<style>` 标签中定义。

## 技术栈

- Vue 3：前端框架
- Vite：构建工具
- Vue Router：路由管理
- Vant UI：移动端 UI 组件库
- Less：CSS 预处理器

## 浏览器兼容性

支持所有现代浏览器和 iOS Safari、Android Chrome 等移动端浏览器。

## 许可证

[MIT](https://opensource.org/licenses/MIT)
