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
- 一个已解析到服务器公网 IP 的域名
- 宿主机 Nginx 及可用的 HTTPS 证书
- 防火墙和云安全组放行 TCP `80/443`

### 启动

```bash
git clone https://github.com/jiangrui1994/CloudSaver.git
cd CloudSaver
cp .env.example .env
# 可按需编辑 .env 中的本地监听端口和 PUBLIC_ORIGIN
docker compose up -d --build
```

容器仅在宿主机 `127.0.0.1:8008` 提供服务，不直接暴露到公网。再由宿主机 Nginx 提供域名和 HTTPS。

首次启动会自动完成以下工作：

1. 在 `config/env` 中生成随机 JWT 密钥及两个随机注册码；
2. 在 `data/database.sqlite` 中初始化 SQLite 数据库；
3. 启动容器内的前端、Nginx 和后端，并由 Compose 持续检查服务健康状态。

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

公网入口由宿主机 Nginx 监听 `80/443`。容器应用的 `8008` 端口只绑定在服务器的 `127.0.0.1`，公网无法直接绕过 HTTPS 访问。可在 `.env` 中通过 `CLOUDSAVER_PORT` 修改本地端口。

Compose 使用宿主机目录持久化数据：

| 宿主机目录 | 容器目录 | 内容 |
| --- | --- | --- |
| `./data/database.sqlite` | `/app/data/database.sqlite` | 用户、设置及 Cookie 等业务数据 |
| `./config` | `/app/config` | 环境配置和 JWT 密钥 |

请定期备份这两个目录。`docker compose down` 不会删除它们。

### 首次登录与必要配置

首次启动后打开 `config/env`，找到自动生成的 `ADMIN_REGISTRATION_CODE`，用它注册首个管理员。为了避免注册码泄露后被提权，管理员注册码在首个管理员创建成功后会永久停止接受新的管理员注册。

普通用户使用同一文件中的 `COMMON_REGISTRATION_CODE` 注册。管理员登录后可以在“设置”中更换普通用户注册码，并配置至少一种搜索源：

- Telegram 频道列表；或
- 教父资源站 Cookie。

每个需要转存的用户还要在“设置”中填写自己的 115 或夸克 Cookie。AI 重命名为可选功能，需要填写兼容 OpenAI 协议的 API 地址、API Key 和模型名。

### 配置文件

首次启动生成的 `config/env` 可直接编辑：

```dotenv
NODE_ENV=production
PORT=8009
JWT_SECRET=自动生成，请勿泄露
ADMIN_REGISTRATION_CODE=自动生成的首次管理员注册码
COMMON_REGISTRATION_CODE=自动生成的普通用户注册码
PUBLIC_ORIGIN=
TELEGRAM_BASE_URL=https://t.me/s
TELE_CHANNELS=[]
JIAOFU_COOKIE=
IMAGE_PROXY_ALLOWED_HOSTS=doubanio.com,cdn-telegram.org,telesco.pe,tutu.pm
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

### 公网安全说明

- 登录状态保存在 `Secure + HttpOnly + SameSite=Strict` Cookie 中，前端不会保存密码或 JWT；旧版本保存在浏览器里的相关数据会在页面启动时清除。
- 密码由后端强制要求 10-72 字节并使用 bcrypt cost 12 保存。
- 登录、注册具有独立限流，连续登录失败会临时锁定账号。
- 后端拒绝跨站写请求；容器内 Nginx 添加 CSP、HSTS、防嵌套等安全响应头。
- 图片代理需要登录，只接受 `IMAGE_PROXY_ALLOWED_HOSTS` 中域名的 HTTPS 图片，避免利用服务器访问内网地址。
- 不要提交或对外发送 `config/env`、`data/database.sqlite`，其中包含登录密钥、网盘 Cookie 和 AI API Key。

### 宿主机 Nginx 反向代理

下面是必要的代理配置示例。请将域名和证书路径替换成自己的值：

```nginx
server {
    listen 80;
    server_name cloudsaver.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cloudsaver.example.com;

    ssl_certificate     /etc/letsencrypt/live/cloudsaver.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloudsaver.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8008;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`X-Forwarded-Proto` 和 `Host` 必须保留，否则安全 Cookie 和跨站来源校验可能无法正常工作。生产环境必须通过 `https://` 访问；HTTP 下浏览器不会发送登录 Cookie。

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
# 将 backend/.env 中的 JWT_SECRET 和两个注册码改为足够长的随机值
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
| 部署 | Docker、Docker Compose、Nginx |

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
