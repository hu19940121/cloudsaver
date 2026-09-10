# CloudSaver

CloudSaver 是一个面向影视资源的网盘搜索、链接解析与转存工具。项目采用 Vue 3 + Express + SQLite，提供独立的 PC/移动端界面，并可通过 Docker Compose 一键部署。

## 实际功能

- **资源搜索**：聚合管理员配置的 Telegram 公开频道和教父影视资源站，可按关键词搜索、按来源浏览并加载更多。
- **链接识别**：搜索结果可识别百度、天翼、阿里、115、123、夸克和移动云盘链接；其中目前只有 **115 网盘和夸克网盘**支持解析目录及一键转存。
- **网盘转存**：登录用户可分别保存自己的 115/夸克 Cookie，查看分享目录、选择文件和目标文件夹后转存。
- **重命名**：支持手动修改转存名称；夸克转存还支持调用兼容 OpenAI Chat Completions 协议的模型，对电影、电视剧和动漫文件进行批量规范命名。
- **豆瓣榜单**：浏览豆瓣电影/剧集热门内容，并可用标题直接搜索资源。
- **多用户与权限**：通过注册码创建普通用户或管理员。网盘 Cookie 和 AI 配置按用户隔离；搜索源、代理及注册码仅管理员可维护。
- **图片代理与响应式界面**：支持资源图片直连/代理切换，豆瓣图片自动代理；PC 使用 Element Plus，移动端使用 Vant。

> 本项目只聚合和处理用户自行配置的第三方资源链接，不提供资源内容。请遵守当地法律法规及相关平台服务条款。

## Docker Compose 一键部署

### 环境要求

- Docker Engine 20.10+（或 Docker Desktop）
- Docker Compose v2（使用 `docker compose` 命令）

### 启动

```bash
git clone https://github.com/jiangrui1994/CloudSaver.git
cd CloudSaver
docker compose up -d --build
```

构建完成后访问：<http://localhost:8008>

首次启动会自动完成以下工作：

1. 在 `config/env` 中生成运行配置和随机 JWT 密钥；
2. 在 `data/database.sqlite` 中初始化 SQLite 数据库；
3. 启动 Nginx、前端和后端，并由 Compose 持续检查服务健康状态。

查看状态和日志：

```bash
docker compose ps
docker compose logs -f app
```

停止服务（不会删除数据）：

```bash
docker compose down
```

更新代码后重新部署：

```bash
git pull
docker compose up -d --build
```

### 端口与持久化

默认访问端口为 `8008`。需要改成其他端口时，可在启动命令前设置 `CLOUDSAVER_PORT`：

```bash
# Linux / macOS
CLOUDSAVER_PORT=9000 docker compose up -d --build

# PowerShell
$env:CLOUDSAVER_PORT=9000; docker compose up -d --build
```

Compose 使用宿主机目录持久化数据：

| 宿主机目录 | 容器目录 | 内容 |
| --- | --- | --- |
| `./data` | `/app/data` | SQLite 数据库 |
| `./config` | `/app/config` | 环境配置和 JWT 密钥 |

请定期备份这两个目录。`docker compose down` 不会删除它们。

### 首次登录与必要配置

打开登录页后先注册管理员账号。源码当前的默认注册码为：

- 管理员：`012101`
- 普通用户：`5549`

登录管理员账号后，建议立即在“设置”中修改两个注册码，并配置至少一种搜索源：

- Telegram 频道列表；或
- 教父资源站 Cookie。

每个需要转存的用户还要在“设置”中填写自己的 115 或夸克 Cookie。AI 重命名为可选功能，需要填写兼容 OpenAI 协议的 API 地址、API Key 和模型名。

### 配置文件

首次启动生成的 `config/env` 可直接编辑：

```dotenv
NODE_ENV=production
PORT=8009
JWT_SECRET=自动生成，请勿泄露
TELEGRAM_BASE_URL=https://t.me/s
TELE_CHANNELS=[]
JIAOFU_COOKIE=
```

修改后执行以下命令使配置生效：

```bash
docker compose restart app
```

`TELE_CHANNELS` 是 JSON 数组，例如：

```dotenv
TELE_CHANNELS=[{"id":"channel_name","name":"频道显示名称"}]
```

这些搜索源也可以由管理员在网页设置中维护；网页中保存的数据库配置优先于环境变量。

### Docker 中使用代理

管理员可在网页中启用 HTTP 代理。容器里的 `127.0.0.1` 指向容器自身，不能表示宿主机。若代理运行在宿主机，请填写：

- 代理地址：`host.docker.internal`
- 代理端口：代理软件实际监听端口（例如 `7890`）

Compose 已为 Linux 添加对应的宿主机映射，Docker Desktop 也原生支持该地址。还需确保代理软件允许来自 Docker 网络的连接。

## 本地开发

### 环境要求

- Node.js 18+
- pnpm 8+

### 启动开发环境

```bash
pnpm install
cp backend/.env.example backend/.env
pnpm dev
```

前端开发服务默认运行在 <http://localhost:8018>，并将 `/api` 和 `/tele-images` 请求代理到后端的 `8009` 端口。

生产构建检查：

```bash
pnpm build
```

## 技术架构

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus、Vant、PWA |
| 后端 | Node.js、Express、TypeScript、Sequelize |
| 数据库 | SQLite |
| 部署 | Docker、Nginx、Docker Compose |

## 产品截图

<details>
<summary>展开截图</summary>

### PC 端

<div align="center">
  <img src="./docs/images/pc/login.png" width="400" alt="PC 登录页面">
  <img src="./docs/images/pc/douban.png" width="400" alt="PC 豆瓣榜单">
  <img src="./docs/images/pc/search.png" width="400" alt="PC 资源搜索">
  <img src="./docs/images/pc/detail.png" width="400" alt="PC 资源详情">
  <img src="./docs/images/pc/save.png" width="400" alt="PC 资源转存">
  <img src="./docs/images/pc/save1.png" width="400" alt="PC 资源转存目录选择">
</div>

### 移动端

<div align="center">
  <img src="./docs/images/mobile/login.png" width="200" alt="移动端登录页面">
  <img src="./docs/images/mobile/search.png" width="200" alt="移动端资源搜索">
  <img src="./docs/images/mobile/save.png" width="200" alt="移动端资源转存">
  <img src="./docs/images/mobile/save1.png" width="200" alt="移动端资源转存目录选择">
</div>

</details>

## License

[MIT](./LICENSE)
