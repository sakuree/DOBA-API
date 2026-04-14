# HomeDepot 销售订单表单 - 字段参考文档

> **简道云表单**：销售订单-Sales order  
> **App ID**：`6438be171ed70300083a1ea4`  
> **Entry ID (表单ID)**：`643a24ab7a839600078e2945`  
> **简道云 API Key**：`Nnq7dmk0k76vjawAFuDZhAZyQ0D0sj4L`  
> **表单链接**：https://www.jiandaoyun.com/dashboard#/app/6438be171ed70300083a1ea4/form/643a24ab7a839600078e2945

---

## 一、订单基本信息

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| Order Date | `_widget_1681532075749` | datetime | 订单日期 |
| Expected Ship Date | `_widget_1711681032298` | datetime | 预计发货日期 |
| PO Number | `_widget_1681532075748` | text | 采购订单号（唯一标识） |
| 订单序列号 | `_widget_1681532075754` | sn | 自动生成的序列号 |
| 销售平台 | `_widget_1681532075752` | text | 销售平台名称 |
| HD URL | `_widget_1718325685907` | text | HomeDepot 商品链接 |
| THD Dept | `_widget_1747703968336` | text | HomeDepot 部门分类 |
| order_key | `_widget_1775042736496` | text | 订单唯一键 |
| merchant_line_number | `_widget_1775046205931` | text | 商户行号 |

---

## 二、商品信息

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 产品SKU | `_widget_1681532075750` | text | 产品SKU编码 |
| Merchant SKU | `_widget_1681532725263` | text | 商户SKU |
| 仓库SKU | `_widget_1705831137586` | text | 仓库内部SKU |
| 是否带电 | `_widget_1713145732949` | text | 产品是否含电池 |
| shipping code | `_widget_1774998626234` | text | 运输代码 |
| Description | `_widget_1682236190363` | text | 产品描述 |
| Quantity | `_widget_1682229760644` | number | 订购数量 |
| 采购SKUM | `_widget_1728975638273` | text | 采购SKU映射 |

---

## 三、订单状态与标记

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 订单状态 | `_widget_1681532075756` | combo | 主订单状态 |
| 订单状态2 | `_widget_1702868990427` | combo | 辅助订单状态 |
| 采购状态 | `_widget_1705540391443` | combo | 采购进度状态 |
| RTV状态 | `_widget_1715247539645` | combo | 退货状态 (Return To Vendor) |
| 状态备注 | `_widget_1704198916196` | text | 状态说明备注 |
| CHUB物流回填 | `_widget_1774418198348` | radiogroup | CHUB物流信息是否已回填 |
| 是否推送到对应的平台 | `_widget_1776075261751` | radiogroup | 订单是否已推送到履约平台 |
| 海外仓订单标记 | `_widget_1774781503356` | radiogroup | 是否为海外仓订单 |
| 订单下载 | `_widget_1745300111641` | combo | 订单下载状态 |
| Need Label | `_widget_1773647030721` | radiogroup | 是否需要面单 |
| Address OK | `_widget_1774335819576` | combo | 地址验证状态 |

---

## 四、财务信息

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| Unit Cost | `_widget_1682229760643` | number | 单位成本 |
| Order Amount | `_widget_1711285120651` | number | 订单金额 |
| Actual amount received | `_widget_1681913164413` | number | 实际收到金额 |
| Actual amount Spent | `_widget_1681913164414` | number | 实际支出金额 |
| 转运处理费 | `_widget_1758702764524` | number | 转运处理费用 |
| Realized profit | `_widget_1681913164417` | number | 已实现利润 |
| Refund | `_widget_1729555219481` | number | 退款金额 |
| Claimed | `_widget_1729555219482` | number | 索赔金额 |

---

## 五、客户与收货信息

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| Customer name | `_widget_1681532075755` | text | 客户姓名 |
| Address1 | `_widget_1681532725264` | text | 地址行1 |
| Address2 | `_widget_1681532725265` | text | 地址行2 |
| City | `_widget_1681532725266` | text | 城市 |
| State | `_widget_1681532725267` | text | 州/省 |
| Postal Code | `_widget_1681532725268` | text | 邮编 |
| Phone No | `_widget_1681532725269` | text | 电话号码 |
| 建议地址 | `_widget_1774340463964` | text | 系统建议的标准化地址 |

---

## 六、物流信息

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 物流渠道 | `_widget_1685601424942` | text | 物流渠道名称 |
| 物流单号 | `_widget_1682230713348` | text | 物流跟踪号 |
| 物流状态 | `_widget_1712458159113` | text | 当前物流状态 |
| UPS Label Created | `_widget_1714985716627` | combo | UPS面单是否已创建 |
| 面单数量 | `_widget_1775098609371` | number | 面单数量 |
| Lable导入-批次 | `_widget_1749429710872` | combo | 面单导入批次号 |
| 实际发货日期 | `_widget_1761201570708` | datetime | 实际发货时间 |

---

## 七、物流跟踪（查询结果区域）

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 查询物流单号 | `_widget_1716640752477` | text | 用于查询的物流单号 |
| 快递公司 | `_widget_1716640752483` | text | 快递公司名称 |
| 快递员/快递站 | `_widget_1716640752478` | text | 快递员或快递站点 |
| 联系方式 | `_widget_1716640752479` | text | 快递员联系方式 |
| 最新状态 | `_widget_1716640752484` | text | 最新物流状态描述 |
| 最新时间 | `_widget_1716640752485` | datetime | 最新物流更新时间 |
| 更新时间 | `_widget_1716640752480` | text | 查询更新时间 |
| 总时长 | `_widget_1745637622323` | text | 物流总耗时 |
| 运输时长 | `_widget_1716640752481` | text | 运输环节耗时 |
| 查询结果 | `_widget_1716640752482` | text | 物流查询原始结果 |
| 跟踪记录 | `_widget_1716640752486` | textarea | 完整物流跟踪记录 |

---

## 八、库存信息

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 大方广库存 | `_widget_1761031444456` | number | 大方广仓库库存 |
| 斑马库存 | `_widget_1761031444457` | number | 斑马(Zebra)仓库库存 |
| Leon库存 | `_widget_1761031444458` | number | Leon(ShipOut)仓库库存 |
| 在途库存 | `_widget_1761190883556` | number | 在途库存数量 |
| 采购-库存 | `_widget_1713935519608` | number | 采购相关库存 |
| 1688现有库存 | `_widget_1714093472017` | number | 1688平台现有库存 |
| Peter库存 | `_widget_1772282122969` | combo | Peter仓库库存 |

---

## 九、人员与权限

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 负责人 | `_widget_1685612285927` | user | 订单负责人 |
| 当前用户 | `_widget_1744240405941` | user | 当前操作用户 |
| Current User | `_widget_1698243912474` | usergroup | 当前用户组 |
| 工号 | `_widget_1681532075751` | text | 员工工号 |
| 工号2 | `_widget_1706928185652` | text | 辅助工号 |
| 第几次出现 | `_widget_1700725909392` | number | 该SKU/PO出现次数 |

---

## 十、AM Rebate（返现相关）

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| AM Discount | `_widget_1744983167297` | combo | AM折扣类型 |
| AM Purchase acct | `_widget_1745206474759` | combo | AM采购账户 |
| Rebate-返现 | `_widget_1718246609950` | combo | 返现状态 |
| Rebate Amount | `_widget_1718246609953` | combo | 返现金额 |
| Proposal Sent | `_widget_1718246609955` | combo | 提案是否已发送 |
| Proposal Sent Date | `_widget_1718246609966` | datetime | 提案发送日期 |
| Succeed | `_widget_1718246609977` | combo | 返现是否成功 |
| Rebate screenshot | `_widget_1718246609989` | image | 返现截图 |
| Rebate Wording | `_widget_1718246609990` | text | 返现话术 |
| Review Recieved | `_widget_1718257776038` | combo | 是否收到评价 |

---

## 十一、备注与附件

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 找货备注1 | `_widget_1703730768706` | text | 找货备注信息1 |
| 找货备注2 | `_widget_1703730768707` | text | 找货备注信息2 |
| 备注 | `_widget_1682161603106` | textarea | 通用备注（多行文本） |
| Pics | `_widget_1688133134139` | image | 产品图片 |
| Attachment | `_widget_1688133134140` | upload | 附件上传 |
| 上线情况 | `_widget_1716776275471` | text | 上线状态说明 |

---

## 十二、子表单 - 采购信息

> **子表单字段名**：`_widget_1681889355992` (subform)

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| 采购SKU | `_widget_1681889355994` | text | 采购SKU编码 |
| 采购平台 | `_widget_1681889355995` | text | 采购平台名称 |
| 采购链接 | `_widget_1681889355996` | text | 采购商品链接 |
| 库存 | `_widget_1681889355997` | number | 采购平台库存 |
| 采购成本 | `_widget_1682229760648` | number | 单次采购成本 |

---

## 十三、子表单 - 链接一致性检查

> **子表单字段名**：`_widget_1764645638546` (subform)

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| CStock | `_widget_1764645638564` | combo | 库存一致性检查 |
| CImage | `_widget_1764645638583` | combo | 图片一致性检查 |
| CDetail | `_widget_1764645638585` | combo | 详情一致性检查 |
| CProfit | `_widget_1764645638606` | combo | 利润一致性检查 |
| CDidcount | `_widget_1764645638628` | combo | 折扣一致性检查 |
| CDelivery time | `_widget_1764645638630` | text | 交付时间信息 |

---

## 十四、AI 检查

| 字段标签 | 字段名 (name) | 类型 | 说明 |
|---------|--------------|------|------|
| AI CHECK | `_widget_1765537138967` | combo | AI检查状态 |
| AI CHECK TIME | `_widget_1767669892519` | datetime | AI检查时间 |
| CImage Note | `_widget_1767772122129` | text | AI图片检查备注 |
| CDetail Note | `_widget_1767772122130` | text | AI详情检查备注 |

---

## 常用字段速查（开发用）

以下是程序开发中最常用的字段映射，可直接复制使用：

```javascript
// HomeDepot 销售订单 - 常用字段映射
const HD_SALES_ORDER_FIELDS = {
  // 表单信息
  APP_ID: '6438be171ed70300083a1ea4',
  ENTRY_ID: '643a24ab7a839600078e2945',

  // 订单基本
  ORDER_DATE: '_widget_1681532075749',
  EXPECTED_SHIP_DATE: '_widget_1711681032298',
  PO_NUMBER: '_widget_1681532075748',
  ORDER_KEY: '_widget_1775042736496',
  MERCHANT_LINE_NUMBER: '_widget_1775046205931',

  // 商品
  PRODUCT_SKU: '_widget_1681532075750',
  MERCHANT_SKU: '_widget_1681532725263',
  WAREHOUSE_SKU: '_widget_1705831137586',
  QUANTITY: '_widget_1682229760644',
  DESCRIPTION: '_widget_1682236190363',
  SHIPPING_CODE: '_widget_1774998626234',
  IS_BATTERY: '_widget_1713145732949',

  // 状态
  ORDER_STATUS: '_widget_1681532075756',
  ORDER_STATUS_2: '_widget_1702868990427',
  PURCHASE_STATUS: '_widget_1705540391443',
  RTV_STATUS: '_widget_1715247539645',
  STATUS_REMARK: '_widget_1704198916196',
  PUSHED_TO_PLATFORM: '_widget_1776075261751',
  CHUB_BACKFILL: '_widget_1774418198348',
  OVERSEAS_WAREHOUSE_MARK: '_widget_1774781503356',
  NEED_LABEL: '_widget_1773647030721',
  ADDRESS_OK: '_widget_1774335819576',
  ORDER_DOWNLOAD: '_widget_1745300111641',

  // 财务
  UNIT_COST: '_widget_1682229760643',
  ORDER_AMOUNT: '_widget_1711285120651',
  ACTUAL_RECEIVED: '_widget_1681913164413',
  ACTUAL_SPENT: '_widget_1681913164414',
  TRANSFER_FEE: '_widget_1758702764524',
  REALIZED_PROFIT: '_widget_1681913164417',
  REFUND: '_widget_1729555219481',
  CLAIMED: '_widget_1729555219482',

  // 客户 & 地址
  CUSTOMER_NAME: '_widget_1681532075755',
  ADDRESS_1: '_widget_1681532725264',
  ADDRESS_2: '_widget_1681532725265',
  CITY: '_widget_1681532725266',
  STATE: '_widget_1681532725267',
  POSTAL_CODE: '_widget_1681532725268',
  PHONE: '_widget_1681532725269',
  SUGGESTED_ADDRESS: '_widget_1774340463964',

  // 物流
  LOGISTICS_CHANNEL: '_widget_1685601424942',
  TRACKING_NUMBER: '_widget_1682230713348',
  LOGISTICS_STATUS: '_widget_1712458159113',
  UPS_LABEL_CREATED: '_widget_1714985716627',
  LABEL_QUANTITY: '_widget_1775098609371',
  LABEL_BATCH: '_widget_1749429710872',
  ACTUAL_SHIP_DATE: '_widget_1761201570708',

  // 库存
  DAFANGGUANG_STOCK: '_widget_1761031444456',
  ZEBRA_STOCK: '_widget_1761031444457',
  LEON_STOCK: '_widget_1761031444458',
  IN_TRANSIT_STOCK: '_widget_1761190883556',

  // 人员
  SALES_PLATFORM: '_widget_1681532075752',
  PERSON_IN_CHARGE: '_widget_1685612285927',
  EMPLOYEE_ID: '_widget_1681532075751',
  REMARK: '_widget_1682161603106',

  // 子表单 - 采购信息
  PURCHASE_INFO_SUBFORM: '_widget_1681889355992',
  PURCHASE_SKU: '_widget_1681889355994',
  PURCHASE_PLATFORM: '_widget_1681889355995',
  PURCHASE_LINK: '_widget_1681889355996',
  PURCHASE_STOCK: '_widget_1681889355997',
  PURCHASE_COST: '_widget_1682229760648',

  // AI 检查
  AI_CHECK: '_widget_1765537138967',
  AI_CHECK_TIME: '_widget_1767669892519',
};
```

---

## 简道云 API 调用示例

### 查询订单（按 PO Number）

```javascript
const axios = require('axios');

const API_KEY = 'Nnq7dmk0k76vjawAFuDZhAZyQ0D0sj4L';
const APP_ID = '6438be171ed70300083a1ea4';
const ENTRY_ID = '643a24ab7a839600078e2945';

// 查询单条数据
const response = await axios.post(
  'https://api.jiandaoyun.com/api/v5/app/entry/data/list',
  {
    app_id: APP_ID,
    entry_id: ENTRY_ID,
    filter: {
      rel: 'and',
      cond: [
        {
          field: '_widget_1681532075748', // PO Number
          method: 'eq',
          value: 'HD-12345678'
        }
      ]
    },
    limit: 10
  },
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### 更新订单

```javascript
// ⚠️ 注意：必须添加 is_start_trigger: true
await axios.post(
  'https://api.jiandaoyun.com/api/v5/app/entry/data/update',
  {
    app_id: APP_ID,
    entry_id: ENTRY_ID,
    data_id: '<数据ID>',
    data: {
      '_widget_1681532075756': { value: '已发货' },       // 订单状态
      '_widget_1682230713348': { value: 'TRACK123456' },  // 物流单号
    },
    is_start_trigger: true  // ⚠️ 必须添加，触发简道云智能助手
  },
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

> **文档版本**：v1.0  
> **创建时间**：2026-04-14  
> **数据来源**：简道云表单配置 (`form_update` 事件)
