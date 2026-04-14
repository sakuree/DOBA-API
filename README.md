# DOBA-API

DOBA API 对接后端服务 - 连接简道云与 DOBA 平台

## 📋 项目说明

本项目用于对接 DOBA 平台 API 和简道云，实现以下核心功能：
- **一件代发订单推送**（Dropshipping）
- **自提订单推送**
- **产品库存和价格同步**
- **订单状态和运单号回写**

## 📖 API 参考文档

完整的 DOBA API 对接规范请查看：[DOBA-API-Reference.md](./docs/DOBA-API-Reference.md)

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
│   └── DOBA-API-Reference.md   # DOBA API 完整规范文档
├── src/                        # 源代码（待开发）
├── .env.example                # 环境变量模板
├── .gitignore
├── package.json
└── README.md
```

## 🔗 仓库信息

| 项目 | 值 |
|------|------|
| **GitHub 仓库** | https://github.com/sakuree/DOBA-API |
| **部署平台** | 待定 |
| **本地路径** | `d:\project\DOBA-API` |

## 🔗 相关链接

- [DOBA API 官方文档](https://open.doba.com/apidoc/retailer/instruction)
- [DOBA 官网](https://www.doba.com)
