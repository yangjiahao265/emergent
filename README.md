# Northstar Data Portal

企业内部数据服务门户，为团队提供统一的数据接入、服务编排与可观测性平台。

## 项目结构

```
.
├── frontend/          # React 前端应用（CRA + Tailwind CSS + Radix UI）
├── agenthub/          # 后端服务与数据处理模块
├── memory/            # 持久化存储层
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- Yarn >= 1.22

### 前端开发

```bash
cd frontend
yarn install
yarn start          # http://localhost:3000
```

### 生产构建

```bash
cd frontend
yarn build
```

构建产物输出到 `frontend/build/` 目录，可直接部署至任意静态文件服务。

## 技术栈

| 层级     | 技术选型                                     |
| -------- | -------------------------------------------- |
| 前端框架 | React 19 + CRA                               |
| UI 组件  | Radix UI + shadcn/ui                         |
| 样式     | Tailwind CSS 3                               |
| 图标     | Lucide React                                 |
| 构建工具 | CRACO（Create React App Configuration Override）|

## 开发约定

- 组件统一放置于 `frontend/src/components/`
- UI 基础组件位于 `frontend/src/components/ui/`
- 环境变量以 `REACT_APP_` 前缀声明，见 `.env.example`

## License

Internal use only.
