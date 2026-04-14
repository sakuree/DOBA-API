# DOBA Retailer API 对接规范参考文档

> 📌 文档来源：https://open.doba.com/apidoc/retailer/instruction  
> 📅 整理日期：2026-04-14  
> 🔗 正式环境：`https://openapi.doba.com/`

---

## 目录

1. [API 调用基础](#一api-调用基础)
2. [签名规则与代码](#二签名规则与代码)
3. [通用响应结构](#三通用响应结构)
4. [产品模块 (Product)](#四产品模块-product)
5. [订单模块 (Order)](#五订单模块-order)
6. [物流模块 (Shipping)](#六物流模块-shipping)
7. [支付模块 (Payment Management)](#七支付模块-payment-management)
8. [基础数据 (Get Basic Information)](#八基础数据-get-basic-information)
9. [平台 ID 对照表](#九平台-id-对照表)
10. [开发注意事项](#十开发注意事项)

---

## 一、API 调用基础

### 1.1 服务地址

| 环境 | 地址 |
|------|------|
| 正式环境 | `https://openapi.doba.com/` |

### 1.2 公共 Header 参数

**所有 API 调用必须在 Header 中传递以下 4 个参数：**

| 参数名 | 说明 | 示例 |
|--------|------|------|
| `appKey` | DOBA 分配的应用 Key | `20201103773281123722592256` |
| `signType` | 固定值 | `rsa2` |
| `timestamp` | 毫秒级时间戳 | `1610501018721` |
| `sign` | RSA2 数字签名 | `ZVyNTYyWlet83DRJ1lw5cRjPgCADqSS124...` |

---

## 二、签名规则与代码

### 2.1 签名规则

> 为防止恶意篡改，所有 API 调用必须携带签名。服务端会验证签名和时间戳（**±1 分钟有效期**），超时或签名非法的请求将被拒绝。

**签名拼接规则：**

将 3 个公共 Header 参数按固定顺序拼接：

```
appKey={appKey}&signType=rsa2&timestamp={timestamp}
```

**示例：**
```
appKey=20201103773281123722592256&signType=rsa2&timestamp=1610501018721
```

然后使用 **RSA2 (SHA256withRSA)** 算法，用 Private Key 对上述字符串签名，结果转为 Base64。

### 2.2 Node.js 签名代码

```javascript
const { KJUR, hextob64, KEYUTIL } = require('jsrsasign');

// ===== 配置 =====
const appKey = 'YOUR_APP_KEY';
const privateKey = 'YOUR_PRIVATE_KEY_BASE64';  // 不含 BEGIN/END 头尾
const signType = 'rsa2';
const hash = 'SHA256withRSA';

/**
 * 生成 DOBA API 签名
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} Base64 编码的签名
 */
const generateSign = (timestamp) => {
    const pvKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    const data = `appKey=${appKey}&signType=${signType}&timestamp=${timestamp}`;
    
    const rsa = KEYUTIL.getKey(pvKeyPem);
    const signature = new KJUR.crypto.Signature({ alg: hash });
    signature.init(rsa);
    signature.updateString(data);
    const signData = signature.sign();
    
    return hextob64(signData);
};

// ===== 调用示例 =====
const axios = require('axios');
const timestamp = Date.now();

const config = {
    headers: {
        'appKey': appKey,
        'signType': signType,
        'timestamp': timestamp,
        'sign': generateSign(timestamp),
        'Content-Type': 'application/json'
    }
};

// POST 请求示例
axios.post('https://openapi.doba.com/api/order/doba/importOrder', requestBody, config);

// GET 请求示例  
axios.get('https://openapi.doba.com/api/ship/list', config);
```

---

## 三、通用响应结构

所有接口响应遵循统一格式：

```json
{
    "responseCode": "000000",
    "responseMessage": "Success",
    "businessData": {
        "businessMessage": "Success",
        "businessStatus": "000000",
        "data": [ ... ]
    }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `responseCode` | String | `000000` = 成功，`999999` = 失败 |
| `responseMessage` | String | 响应消息 |
| `businessData` | Object | 具体业务数据 |
| `businessData.businessStatus` | String | 业务状态码 |
| `businessData.businessMessage` | String | 业务消息 |
| `businessData.data` | Array/Object | 业务数据体 |

---

## 四、产品模块 (Product)

### 4.1 查询类目列表 (Query Category List)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/goods/doba/category/list` |
| **说明** | 获取 DOBA 商品分类目录树 |

**请求参数：** 无

**响应 `businessData.data[]`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `categoryId` | String | 类目 ID |
| `categoryName` | String | 类目名称 |
| `children` | Array | 子类目列表 |

---

### 4.2 查询 SPU 列表 (Query SPU List)

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/goods/doba/spu/list` |
| **说明** | 分页获取产品列表，支持关键字搜索和类目筛选 |

**请求参数（BODY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `pageNum` | 否 | Integer | 页码，默认 1 |
| `pageSize` | 否 | Integer | 每页数量，默认 20 |
| `keyword` | 否 | String | 搜索关键字 |
| `categoryId` | 否 | String | 类目 ID |
| `shipFromCountry` | 否 | String | 发货国家代码 |

**响应 `businessData`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | Integer | 总记录数 |
| `data[]` | Array | 产品列表 |
| `data[].spuId` | String | 产品唯一 ID（查详情用） |
| `data[].title` | String | 产品标题 |
| `data[].mainImage` | String | 主图 URL |
| `data[].minPrice` | Number | 最低价格 |
| `data[].maxPrice` | Number | 最高价格 |

---

### 4.3 查询 SPU 详情 (Query SPU Detail)

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/goods/doba/spu/detail` |
| **说明** | 获取产品详情，含 SKU 变体、库存和价格 |

**请求参数（BODY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `spuId` | ✅ | String | 产品 ID |

**响应 `businessData.data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | String | 产品标题 |
| `brand` | String | 品牌 |
| `description` | String | 产品描述 |
| `images` | Array | 图片 URL 列表 |
| `children[]` | Array | **SKU 变体列表** |
| `children[].skuId` | String | 变体 ID |
| `children[].itemNo` | String | **商品编号（下单用）** ⭐ |
| `children[].sellingPrice` | Number | **售价** 💰 |
| `children[].msrpPrice` | Number | 建议零售价 |
| `children[].stocks` | Object | 库存对象 |
| `children[].stocks.availableNum` | Integer | **可用库存** 📦 |
| `children[].saleDetail` | Object | 促销信息 |
| `children[].saleDetail.salePrice` | Number | 促销价 |
| `children[].attributes` | Array | 变体属性（颜色、尺码等） |

---

### 4.4 查询库存与价格 (Query Inventory & Price)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/goods/doba/stock` |
| **说明** | 批量快速查询商品库存和价格 |

**请求参数（QUERY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `itemNo` | ✅ | String | DOBA 商品编号，**逗号分隔**，单次最多 **20** 个 |

**请求示例：**
```
https://openapi.doba.com/api/goods/doba/stock?itemNo=ITEM001,ITEM002,ITEM003
```

**响应 `businessData.data[]`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `itemNo` | String | 商品编号 |
| `availableNum` | Integer | 可用库存 |
| `sellingPrice` | Number | 售价 |
| `msrpPrice` | Number | 建议零售价 |

---

## 五、订单模块 (Order)

### 5.1 导入订单 (Import Order) ⭐ 核心接口

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/order/doba/importOrder` |
| **说明** | 创建一件代发（Dropshipping）或自提订单。下单前须先获取物流方式列表和运费估算 |

**前置准备：**
1. 调用 **Get Shipping Method List** 获取可用物流方式的 `shippingMethodId`
2. 可选：调用 **Product Shipping Rate Estimate** 估算运费
3. 调用 **Get Country/Region List** 获取国家/省份的标准代码

**请求参数（BODY）：**

#### 顶层参数

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `billingAddress` | ✅ | Object | 账单地址 |
| `openApiImportDSOrderList` | ✅ | Array | 订单列表（可批量导入多个订单） |

#### `billingAddress` 对象

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `name` | ✅ | String | 姓名，Max 100 字符 |
| `addr1` | ✅ | String | 地址行1，Max 160 字符 |
| `addr2` | 否 | String | 地址行2，Max 160 字符 |
| `city` | ✅ | String | 城市，Max 100 字符 |
| `countryCode` | ✅ | String | 国家两位简码（如 `US`），通过 Get Country/Region List 获取 |
| `provinceCode` | ✅ | String | 州/省两位简码（如 `NY`），通过 Get Country/Region List 获取 |
| `zip` | ✅ | String | 邮编，Max 20 字符 |
| `telephone` | ✅ | String | 电话号码 |
| `phoneExtension` | 否 | String | 分机号 |

#### `openApiImportDSOrderList[]` 数组元素

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `dsPlatformId` | ✅ | String | **平台 ID**（见[平台 ID 对照表](#九平台-id-对照表)） |
| `orderNumber` | ✅ | String | 每个订单在同一批次中的唯一编号 |
| `goodsDetailDTOList` | ✅ | Array | 商品明细列表 |
| `shippingAddress` | ✅ | Object | **收货地址**（字段同 billingAddress） |
| `remark` | 否 | String | 订单备注，Max 500 字符 |
| `storeOrderAmount` | 否 | Number | 订单原始销售金额（用于记录） |
| `storeOrderBusiId` | 否 | String | 原始订单号（用于防重/溯源） |

#### `goodsDetailDTOList[]` 商品明细

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `itemNo` | ✅ | String | **商品编号**（DOBA 的 itemNo，通过产品详情接口获取） |
| `quantityOrdered` | ✅ | String | 购买数量 |
| `shippingMethodId` | ✅ | String | **物流方式 ID**（通过 Get Shipping Method List 获取） |

#### `shippingAddress` 收货地址

与 `billingAddress` 字段完全相同：`name`, `addr1`, `addr2`, `city`, `countryCode`, `provinceCode`, `zip`, `telephone`, `phoneExtension`

**请求示例：**

```json
{
    "billingAddress": {
        "addr1": "xxx",
        "addr2": "xxx",
        "city": "New York",
        "countryCode": "8061",
        "name": "xxx",
        "phoneExtension": "",
        "provinceCode": "US",
        "telephone": "0000000000",
        "zip": "10041"
    },
    "openApiImportDSOrderList": [
        {
            "dsPlatformId": "99",
            "goodsDetailDTOList": [
                {
                    "itemNo": "xxx",
                    "quantityOrdered": "1",
                    "shippingMethodId": "xxx"
                }
            ],
            "orderNumber": "xxx",
            "remark": "",
            "shippingAddress": {
                "addr1": "xxx",
                "addr2": "",
                "city": "xxx",
                "countryCode": "xxxx",
                "name": "xxx",
                "phoneExtension": "",
                "provinceCode": "xxx",
                "telephone": "xxx",
                "zip": "xxx"
            },
            "storeOrderAmount": 100,
            "storeOrderBusiId": "xxx"
        }
    ]
}
```

**响应 `businessData`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `ordBatchId` | String | 订单批次 ID（后续查询/支付用） |
| `encryptOrdBatchIds` | String | **加密批次 ID（支付接口必须用这个）** |

---

### 5.2 查询物流运单信息 (Get Order Shipment Information)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/order/doba/queryOrderShipment` |
| **说明** | 获取订单的物流运单号和包裹状态 |

**请求参数（QUERY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `ordBatchId` | ✅ | String | 订单批次 ID |

**响应 `businessData.data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `trackingNo` | String | **运单号** 🚚 |
| `shippingCarrier` | String | 承运商名称 |
| `shippingStatus` | String | 物流状态 |

---

### 5.3 查询订单详情 (Get Order Detail)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/order/doba/queryOrderDetail` |
| **说明** | 获取订单完整详情，包括状态、金额、物流等 |

**请求参数（QUERY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `ordBatchId` | ✅ | String | 订单批次 ID |

**响应关键字段：**

| 字段路径 | 类型 | 说明 |
|----------|------|------|
| `orderStatus` | String | 订单状态 |
| `payStatus` | String | 支付状态 |
| `productAmount` | Number | 产品总额 |
| `shippingAmount` | Number | 运费 |
| `totalAmount` | Number | 订单总金额 |

---

### 5.4 确认收货 (Confirm Order as Received)

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/order/doba/confirmReceived` |
| **说明** | 确认订单已收到货物 |

**请求参数（BODY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `ordBatchId` | ✅ | String | 订单批次 ID |

---

### 5.5 取消订单 (Cancel Order)

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/order/doba/closeOrder` |
| **说明** | 取消未发货的订单 |

**请求参数（BODY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `ordBatchId` | ✅ | String | 订单批次 ID |
| `closeReasonType` | ✅ | Integer | 取消原因类型 |

---

## 六、物流模块 (Shipping)

### 6.1 获取物流方式列表 (Get Shipping Method List)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/ship/list` |
| **说明** | 获取所有供应商可用的物流方式，用于开发者提前做物流映射 |

**请求参数：** 无

**请求示例：**
```
https://openapi.doba.com/api/ship/list
```

**响应 `businessData.data[]`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `shippingMethodId` | String | **物流方式 ID（下单用）** ⭐ |
| `shippingMethodName` | String | 物流方式名称 |
| `carrier` | String | 承运商 |

---

### 6.2 运费估算 (Product Shipping Rate Estimate)

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/shipping/doba/cost/goods` |
| **说明** | 根据目的地和商品信息估算可用物流方式和运费 |

**请求参数（BODY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `shipToCountry` | ✅ | String | 目的国家代码（ISO 3166，如 `US`） |
| `shipToProvince` | 否 | String | 目的州/省简码（如 `NY`），通过 Get Country/Region List 获取 |
| `shipToCity` | 否 | String | 目的城市，Max 100 |
| `shipToZipCode` | 否 | String | 目的邮编，Max 20 |
| `platformId` | 否 | String | 平台 ID（如订单来自 eBay/Shopify，可填） |
| `shipId` | 否 | String | 指定物流方式 ID（可通过 Get Shipping Method List 获取） |
| `goods` | ✅ | Array | 商品列表，**单次最多 20 个** |

#### `goods[]` 商品信息

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `itemNo` | ✅ | String | 商品编号 |
| `quantity` | ✅ | Integer | 购买数量 |

**响应 `businessData.data[]`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `shippingMethodId` | String | 物流方式 ID |
| `shippingMethodName` | String | 物流方式名称 |
| `shippingCost` | Number | **预估运费** 💰 |

---

## 七、支付模块 (Payment Management)

### 7.1 获取信用卡/借记卡列表 (Get Credit Or Debit Cards)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/pay/payManage/doba/queryPaymentCardList` |
| **说明** | 查询账户已绑定的银行卡信息。如未绑定，需先在 www.doba.com 添加 |

**请求参数（QUERY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `cardId` | 否 | Number | 卡 ID。不传则返回所有卡；传入则返回指定卡 |

**请求示例：**
```
https://openapi.doba.com/api/pay/payManage/doba/queryPaymentCardList?cardId=%40integer(0, 100000)%29
```

**响应 `businessData.data[]`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `cardHolderName` | String | 持卡人姓名 |
| `cardId` | Number | 卡 ID（支付时使用） |
| `cardNum` | String | 卡号（脱敏） |

---

### 7.2 订单支付 (Order Payment) ⭐ 核心接口

| 项目 | 值 |
|------|------|
| **方法** | `POST` |
| **URL** | `https://openapi.doba.com/api/pay/payment/doba/submit` |
| **说明** | 对已创建的订单进行支付。支持 PrePay 余额或信用卡支付 |

**请求参数（BODY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `paymentMethodCode` | ✅ | Number | 支付方式：**`7` = PrePay 预付余额**，**`0` = 信用卡**（信用卡会产生手续费） |
| `encryptOrdBatchIds` | ✅ | String | **加密订单批次 ID**（从 Import Order 响应获取） |
| `cardId` | 否 | Number | 银行卡 ID（选择信用卡支付时 **必填**，通过 Get Credit Or Debit Cards 获取） |

**请求示例：**
```json
{
    "cardId": 12345,
    "encryptOrdBatchIds": "encrypted_batch_id_string",
    "paymentMethodCode": 7
}
```

> ⚠️ **重要**：订单导入后 **必须** 调用支付接口完成付款，订单才会进入处理/发货流程。

---

### 7.3 预付余额查询 (PrePay Balance Check)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/pay/payManage/doba/queryPrePayBalance` |
| **说明** | 查询 DOBA 账户的 PrePay 预付余额 |

**请求参数：** 无

**响应 `businessData.data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `balance` | Number | 当前预付余额 |

---

## 八、基础数据 (Get Basic Information)

### 8.1 获取国家/地区列表 (Get Country/Region List)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/region/doba/country/list` |
| **说明** | 获取国家的 2 位简码。不传参则返回所有平台开通的国家；传入国家代码则返回该国所有省/州 |

**请求参数（QUERY）：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `countryCode` | 否 | String | 国家简码。不传返回所有国家；传入则返回该国下所有省/州 |

**请求示例：**
```
# 获取所有国家
https://openapi.doba.com/api/region/doba/country/list

# 获取美国所有州
https://openapi.doba.com/api/region/doba/country/list?countryCode=US
```

**响应 `businessData.data[]`：**

```json
{
    "businessData": {
        "businessMessage": "000000",
        "businessStatus": "Success",
        "data": [
            {
                "regionCode": "US",
                "regionNameCn": "美国",
                "regionNameEn": "United States"
            }
        ]
    }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `regionCode` | String | **地区代码**（下单地址中的 `countryCode` / `provinceCode` 用这个） |
| `regionNameCn` | String | 中文名称 |
| `regionNameEn` | String | 英文名称 |

---

### 8.2 获取第三方平台列表 (Get the List of the Third Party Marketplace/Platform)

| 项目 | 值 |
|------|------|
| **方法** | `GET` |
| **URL** | `https://openapi.doba.com/api/retailer/doba/platform/list` |
| **说明** | 获取平台 ID 列表（下单时 `dsPlatformId` 参数用） |

**请求参数：** 无

---

## 九、平台 ID 对照表

Import Order 接口的 `dsPlatformId` 参数必须使用以下值：

| Platform ID | 平台名称 |
|-------------|----------|
| `1` | Amazon |
| `2` | eBay |
| `3` | Shopify |
| `4` | Wish |
| `7` | BigCommerce |
| `8` | WooCommerce |
| `9` | Wix |
| `10` | Newegg |
| `11` | Square |
| `12` | Shift4Shop |
| `13` | Walmart |
| `16` | Overstock |
| `17` | Wayfair |
| `18` | AliExpress |
| `19` | TikTok Shop |
| `20` | SHEIN |
| `21` | Temu |
| `22` | Target |
| `23` | Alibaba |
| `24` | BestBuy |
| `25` | Home Depot |
| `26` | Etsy |
| `27` | Lowe's |
| `99` | Others |

---

## 十、开发注意事项

### ⚠️ 关键陷阱

1. **国家/省份代码**  
   Import Order 的 `countryCode` 和 `provinceCode` 使用 **2 位标准简码**（如 `US`、`NY`），需通过 **Get Country/Region List** 接口确认准确值。

2. **订单必须支付**  
   调用 Import Order 后仅创建了订单，**必须再调用 Order Payment 接口完成支付**，订单才会进入处理流程。

3. **签名时间戳有效期 ±1 分钟**  
   服务器会校验 timestamp，请确保服务器时间准确。

4. **itemNo vs skuId**  
   - `itemNo`：商品编号，是 DOBA 内部唯一标识，**下单用这个**
   - `skuId`：变体 ID，在产品详情中返回

5. **shippingMethodId 必须有效**  
   下单前务必通过 Get Shipping Method List 获取有效的物流方式 ID。

6. **批量查询限制**  
   - 库存/价格查询：单次最多 **20 个** itemNo
   - 运费估算：单次最多 **20 个** 商品

7. **信用卡支付有手续费**  
   使用信用卡（`paymentMethodCode=0`）支付会产生额外手续费，建议使用 PrePay 余额（`paymentMethodCode=7`）。

### 📋 完整下单流程

```
1. GET  /api/region/doba/country/list?countryCode=US    → 获取省/州代码
2. GET  /api/ship/list                                   → 获取物流方式 ID
3. POST /api/shipping/doba/cost/goods                    → 估算运费（可选）
4. POST /api/order/doba/importOrder                      → 创建订单
5. POST /api/pay/payment/doba/submit                     → 支付订单
6. GET  /api/order/doba/queryOrderDetail?ordBatchId=xxx  → 查询订单状态
7. GET  /api/order/doba/queryOrderShipment?ordBatchId=xxx → 获取运单号
```

### 🔑 当前密钥信息

| 项目 | 值 |
|------|------|
| **Public Key** | `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...`（已上传至 DOBA 开发者管理后台） |
| **Private Key** | `MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...`（用于代码签名，**禁止泄露**） |
| **appKey** | ⚠️ **待确认**（需登录 DOBA 开发者后台获取） |
