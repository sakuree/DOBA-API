# DOBA-API

DOBA API 对接后端服务 - 连接简道云与 DOBA 平台

## 📋 项目说明

本项目用于对接 DOBA 平台 API 和简道云，实现以下核心功能：
- **一件代发订单推送**（Dropshipping）
- **自提订单推送**
- **产品库存和价格同步**
- **订单状态和运单号回写**

## 📖 参考文档

| 文档 | 说明 |
|------|------|
| [DOBA-API-Reference.md](./docs/DOBA-API-Reference.md) | DOBA API 完整对接规范（签名、下单、物流、库存等） |
| [HomeDepot-SalesOrder-Fields.md](./docs/HomeDepot-SalesOrder-Fields.md) | 简道云 HomeDepot 销售订单表单字段映射（92 个字段） |

## 🔧 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js 18+ |
| 框架 | Express.js |
| 签名库 | jsrsasign（RSA2 签名） |
| HTTP 客户端 | axios |

## 📁 项目结构

```
DOBA-API/
├── docs/
│   ├── DOBA-API-Reference.md           # DOBA API 完整规范文档
│   └── HomeDepot-SalesOrder-Fields.md  # 简道云 HomeDepot 销售订单字段映射
├── src/                                # 源代码（待开发）
├── .env.example                        # 环境变量模板
├── .gitignore
├── package.json
└── README.md
```

## 🚀 部署信息

| 项目 | 值 |
|------|------|
| **GitHub 仓库** | https://github.com/sakuree/DOBA-API |
| **部署平台** | 阿里云（PM2 + Nginx） |
| **本地路径** | `d:\project\DOBA-API` |
| **服务器路径** | `/opt/apps/doba-api` |
| **PM2 进程名** | `doba-api` |
| **端口** | 3010 |
| **服务器 IP** | `47.100.120.129` |

### 端口分配依据（2026-04-14 实测 `ss -tlnp`）

| 端口 | 占用应用 | 状态 |
|------|----------|------|
| 3001 | email-server | ✅ 运行中 |
| 3002 | ups-app（SKILL 记录） | ⚠️ 当前未运行，但保留 |
| 3003 | reports-app | ✅ 运行中 |
| 3004 | target-order-processing | ✅ 运行中 |
| 3005 | jdy-shipstation-relay | ✅ 运行中 |
| 3006 | overseas-inventory | ✅ 运行中 |
| 3007 | overseas-fulfillment | ✅ 运行中 |
| 3008 | overseas-order-tagging | ✅ 运行中 |
| 3009 | giga-api-hub | ✅ 运行中 |
| **3010** | **doba-api（本项目）** | 🆕 **可用，已分配** |

## 🔗 相关链接

- [DOBA API 官方文档](https://open.doba.com/apidoc/retailer/instruction)
- [DOBA 官网](https://www.doba.com)
