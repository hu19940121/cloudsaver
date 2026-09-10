# CloudSaver


一个基于 Vue 3 + Express 的网盘资源搜索与转存工具，支持响应式布局，移动端与PC完美适配，可通过 Docker 一键部署。

## 功能特性

- 🔍 多源资源搜索
  - 支持多个资源订阅源搜索
  - 支持关键词搜索与资源链接解析
  - 支持豆瓣热门榜单展示
- 💾 网盘资源转存
  - 支持**115 网盘，夸克网盘，天翼网盘，123云盘**一键转存
  - 支持转存文件夹展示与选择
- 👥 多用户系统
  - 支持用户注册登录
  - 支持管理员与普通用户权限区分
- 📱 响应式设计
  - 支持 PC 端与移动端自适应布局
  - 针对不同设备优化的交互体验

## 产品展示

<details>
<summary>点击展开截图预览</summary>

### PC 端

<div align="center">
  <img src="./docs/images/pc/login.png" width="400" alt="PC登录页面">
   <img src="./docs/images/pc/douban.png" width="400" alt="PC豆瓣榜单">
  <p>登录页面/榜单</p>
</div>

<div align="center">
  <img src="./docs/images/pc/search.png" width="400" alt="PC资源搜索">
  <img src="./docs/images/pc/detail.png" width="400" alt="PC资源详情">
  <p>资源搜索/资源详情</p>
</div>

<div align="center">
  <img src="./docs/images/pc/save.png" width="400" alt="PC资源转存">
  <img src="./docs/images/pc/save1.png" width="400" alt="PC资源转存">
  <p>资源转存</p>
</div>

### 移动端

<div align="center">
  <div style="display: inline-block; margin: 0 20px;">
    <img src="./docs/images/mobile/login.png" width="200" alt="移动端登录页面">
    <img src="./docs/images/mobile/search.png" width="200" alt="移动端资源搜索">
    <img src="./docs/images/mobile/save.png" width="200" alt="移动端资源转存">
    <img src="./docs/images/mobile/save1.png" width="200" alt="移动端资源转存">
  </div>
</div>

</details>

## 技术栈

### 前端

- 核心框架
  - Vue 3
  - TypeScript
  - Vite
- 状态管理
  - Pinia
- 路由管理
  - Vue Router
- UI 组件库
  - Element Plus (PC)
  - Vant (Mobile)
- 工具库
  - Axios

### 后端

- 运行环境
  - Node.js
  - Express
- 数据存储
  - SQLite3

## 环境要求

- Node.js >= 18.x
- pnpm >= 8.x (推荐)

## 快速开始

### 开发环境

1. 克隆项目

```bash
git clone https://github.com/jiangrui1994/CloudSaver.git
cd CloudSaver
```

2. 安装依赖

```bash
pnpm install
```

3. 配置环境变量

```bash
cp ./backend/.env.example ./backend/.env
```

根据 `.env.example` 文件说明配置必要的环境变量。

4. 启动开发服务器

```bash
pnpm dev
```

### 生产环境部署

1. 构建前端

```bash
pnpm build:frontend
```

2. 构建后端

```bash
cd backend
pnpm build
```

3. 启动服务

```bash
pnpm start
```



#### Docker Compose 部署





#### /app/config 目录说明

- `env` 文件：包含后端环境变量配置

```bash
# JWT配置
JWT_SECRET=your_jwt_secret_here

# Telegram配置
TELEGRAM_BASE_URL=https://t.me/s

```

运行：

```bash
docker-compose up -d
```

> **注意**: 测试版（:test标签）包含最新的功能开发和bug修复，但可能存在不稳定因素。建议生产环境使用稳定版（:latest标签）。

## 注意事项

1. 资源搜索需要配置代理环境
2. 默认注册码
   - 管理员：012101
   - 普通用户：5549
