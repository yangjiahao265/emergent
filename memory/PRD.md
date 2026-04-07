# HTTP 透明代理服务 - PRD

## 项目概述
基于 URL 路径的安全透明 HTTP 代理服务。

## 架构
- **Frontend**: React + Tailwind CSS (port 3000) - 开发者文档说明页
- **Backend**: FastAPI (port 8001) - 核心代理逻辑
- **无数据库依赖**（纯代理服务）

## 核心需求（静态）
1. URL 格式：`/api/{target_url:path}` 例：`/api/https://target.com/xxx`
2. Bearer Token 鉴权：`Authorization: Bearer <token>`
3. 转发所有 HTTP 方法（GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS）
4. 转发所有请求头（包含 Authorization）到目标服务器
5. 转发请求体（JSON/表单/二进制）
6. 原样返回目标服务器响应（状态码、响应头、响应体）
7. 支持跨域请求（CORS）
8. 任意 URL 均可代理

## 已实现功能（2026-02）
- [x] 代理核心逻辑（`/app/backend/server.py`）
- [x] Bearer Token 鉴权（401/403 错误处理）
- [x] CORS 中间件支持
- [x] Hop-by-hop header 过滤（不转发 connection/transfer-encoding 等）
- [x] URL 双斜杠修复（https:/ → https://）
- [x] 查询字符串透传
- [x] httpx 异步代理客户端（跟随重定向，60s 超时）
- [x] 前端开发者文档页（英文+中文）
- [x] 健康检查端点（`/api/health`）

## 配置
- Token: `PROXY_AUTH_TOKEN` 在 `/app/backend/.env`
- 当前 Token: `sk-emergent-proxy-8d4f9a2c1e7b5f3a`

## P0/P1/P2 待办
- P1: 支持自定义 Token 管理（多 Token）
- P1: 请求日志记录与审计
- P2: 速率限制（Rate Limiting）
- P2: 目标域名白名单/黑名单
- P2: 请求/响应体大小限制

## 接口文档
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/{target_url:path}` | ALL | 透明代理 |
