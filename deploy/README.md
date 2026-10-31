# Ubuntu 单机部署

应用运行在 Docker 内，Nginx 使用已有 HTTPS 的 /fde 路径反向代理。仅将容器端口绑定到 127.0.0.1:3006，外网不能绕过访问认证直连应用。

## 构建与启动

```bash
docker build --build-arg NEXT_PUBLIC_BASE_PATH=/fde -t fde-portal:<commit> .
sudo install -d -m 700 -o 1000 -g 1000 /opt/fde-portal/data
FDE_IMAGE=fde-portal:<commit> docker compose -f deploy/compose.yaml up -d
```

NEXT_PUBLIC_BASE_PATH 是构建期配置，默认本地开发仍使用根路径。Dockerfile 启用 Next standalone，包含 public、静态文件和按需执行的 Skills。Docker 构建上下文排除 .env、.data、Git、测试产物和本地依赖。

在现有 HTTPS server 中 include deploy/nginx-location.conf 对应的服务器文件。先备份现有 Nginx 配置，使用独立的 /etc/nginx/.fde-portal.htpasswd（root:www-data、0640），运行 nginx -t，通过后 reload。访问认证覆盖页面、API 和下载，不修改已有应用的路由或账号。

## 数据与密钥

持久化目录 /opt/fde-portal/data 映射到 /app/.data。企业项目位于 workbench/，通过网页上传的 DeepSeek 配置位于 ai-config.json，服务端以 0600 权限写入。上传需在 HTTPS 与访问认证后进行。访问密码文件和 DeepSeek 密钥均不得加入 Git、镜像或部署日志。

项目默认空白；不复制开发机的数据或密钥。当前仍为可信用户共享的单机工作台，访问密码不是多用户权限隔离。

## 验证与回退

- 验证 HTTPS 证书、匿名请求 401、登录后页面与 API 200、18 个 Skills 可读取。
- 验证 /fde 前缀下的静态文件、原生 fetch、下载以及 Next 链接。
- docker inspect fde-portal 查看 Health 状态；docker logs --tail 50 fde-portal 查看启动异常。
- restart: unless-stopped 使进程退出或主机重启后恢复；日志按 10 MB × 3 轮转。
- 更新时保留旧镜像与源码 release，切换 FDE_IMAGE 后 docker compose up -d。回退改回原镜像，不删除 data。
- 数据备份包含敏感配置，需限制读取权限。HTTPS 证书由服务器原有续期机制维护。
