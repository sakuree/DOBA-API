const express = require('express');
const crypto = require('crypto');
const feishuBot = require('./feishuBot');
const jiandaoService = require('./services/jiandaoService');
const dobaService = require('./services/dobaService');
const orderSplitter = require('./services/orderSplitter');

const router = express.Router();

const processedEvents = new Set();

function decryptFeishuMsg(encryptStr) {
    const key = process.env.FEISHU_ENCRYPT_KEY;
    if (!key) throw new Error('FEISHU_ENCRYPT_KEY missing');

    const encryptedBuf = Buffer.from(encryptStr, 'base64');
    const iv = encryptedBuf.slice(0, 16);
    const cipherText = encryptedBuf.slice(16);
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(cipherText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

// 获取有效的物流方式 (缓存在内存中)
let cachedShippingMethods = null;

async function pushToDoba(order, isPickUp) {
    try {
        if (!cachedShippingMethods) {
            cachedShippingMethods = await dobaService.getShippingMethods();
        }

        // 动态匹配物流方式
        let shippingMethodId = process.env.DOBA_DEFAULT_SHIPPING_METHOD || '';
        
        let matchingMethod = null;
        if (isPickUp) {
            matchingMethod = cachedShippingMethods.find(m => 
                m.shippingMethodName.toLowerCase().includes('pick up') || 
                m.shippingMethodName.toLowerCase().includes('pickup')
            );
        } else {
            // 一件代发，可以找 standard，或者取第一个
            matchingMethod = cachedShippingMethods.find(m => 
                m.shippingMethodName.toLowerCase().includes('standard')
            );
        }

        if (matchingMethod) {
            shippingMethodId = matchingMethod.shippingMethodId;
        } else if (cachedShippingMethods.length > 0) {
            shippingMethodId = cachedShippingMethods[0].shippingMethodId;
        }

        if (!shippingMethodId) {
            throw new Error(`找不到可用的 DOBA ${isPickUp ? '自提' : '代发'} 物流通道 (shippingMethod)`);
        }

        const quantity = order.quantity ? String(order.quantity) : "1";
        
        // 使用采购 SKU
        const itemNo = order.purchase_sku;
        if (!itemNo) {
            throw new Error('缺少子表单采购 SKU，请求被拦截');
        }

        // 校验地址和联系信息，拒绝兜底
        const name = (order._widget_1681532075755 || '').trim();
        const addr1 = (order._widget_1681532725264 || '').trim();
        const city = (order._widget_1681532725266 || '').trim();
        const provinceCode = (order._widget_1681532725267 || '').trim();
        const zip = (order._widget_1681532725268 || '').trim();
        const telephone = (order._widget_1681532725269 || '').trim();

        if (!name || !addr1 || !city || !provinceCode || !zip || !telephone) {
            throw new Error('缺少完整的收件人联系信息（姓名/地址/电话/邮编等核心为空），停止推送以防错误');
        }

        const address = {
            name,
            addr1,
            addr2: order._widget_1681532725265 || '',
            city,
            provinceCode, 
            countryCode: 'US', // 一般默认美国
            zip,
            telephone,
            phoneExtension: ""
        };

        const payload = {
            billingAddress: address,
            openApiImportDSOrderList: [
                {
                    dsPlatformId: "25", // 25 = Home Depot
                    orderNumber: order._widget_1681532075748 + (order._sub_index ? `-${order._sub_index}` : ''), // 用于 DOBA 防重/唯一
                    remark: isPickUp ? "Pick up order" : "Dropshipping order",
                    storeOrderAmount: Number(order._widget_1711285120651 || 0),
                    storeOrderBusiId: order._widget_1681532075748,
                    shippingAddress: address,
                    goodsDetailDTOList: [
                        {
                            itemNo: itemNo,
                            quantityOrdered: quantity,
                            shippingMethodId: shippingMethodId
                        }
                    ]
                }
            ]
        };

        const createRes = await dobaService.importOrder(payload);
        const batchId = createRes.encryptOrdBatchIds;

        if (!batchId) {
            throw new Error('No encryptOrdBatchIds in doba importOrder response');
        }

        // 进行支付
        let paymentMethodCode = parseInt(process.env.DOBA_PAYMENT_METHOD || '7', 10);
        await dobaService.submitPayment(batchId, paymentMethodCode);

        return { success: true, batchId };
    } catch (error) {
        console.error('DOBA push error:', error.message);
        return { success: false, error: error.message };
    }
}


router.post('/event', async (req, res) => {
    let body = req.body;
    
    if (body.encrypt) {
        try {
            body = decryptFeishuMsg(body.encrypt);
        } catch (err) {
            return res.status(400).json({ error: 'Decryption failed' });
        }
    }

    if (body.type === 'url_verification') {
        return res.json({ challenge: body.challenge });
    }

    res.json({ code: 0, msg: 'ok' }); // 立即响应飞书

    if (body.header?.event_type !== 'im.message.receive_v1') return;

    const message = body.event.message;
    const chatId = message.chat_id;
    const messageId = message.message_id;

    if (processedEvents.has(messageId)) return;
    processedEvents.add(messageId);

    const msgType = message.message_type;
    if (msgType !== 'text') return;

    let content;
    try {
        content = JSON.parse(message.content);
    } catch {
        return;
    }

    const text = (content.text || '').trim();
    const cmd = text.replace(/@_user_\d+/g, '').replace(/@_all/g, '').replace(/@_user_[a-z0-9]+/gi, '').replace(/\s+/g, ' ').trim();
    const cmdLower = cmd.toLowerCase();

    if (cmdLower.startsWith('推单') || cmdLower.startsWith('push')) {
        const afterKeyword = cmd.replace(/^(推单|push)\s*(doba)?\s*/i, '').trim();
        const poNumbers = afterKeyword.split(/[,，\s\n]+/).map(s => s.trim()).filter(s => s.length > 0);

        if (poNumbers.length === 0) {
            await feishuBot.sendText(chatId, '⚠️ 请提供订单号\n\n用法: 推单 PO1,PO2');
            return;
        }

        await feishuBot.sendText(chatId, `⏳ 正在查询 ${poNumbers.length} 个订单...`);

        try {
            const jdOrders = await jiandaoService.queryOrdersByPos(poNumbers);
            
            if (jdOrders.length === 0) {
                await feishuBot.sendText(chatId, `❌ 未找到匹配的订单\n请检查 PO 号是否正确`);
                return;
            }

            await feishuBot.sendText(chatId, `✅ 查到 ${jdOrders.length} 个简道云原始订单，正在处理推单逻辑...`);
            
            const results = [];

            for (const orderData of jdOrders) {
                const poNumber = orderData._widget_1681532075748;
                const statusRemark = (orderData._widget_1704198916196 || '').toLowerCase();
                const isPickUp = statusRemark.includes('pick');

                const subformData = orderData._widget_1681889355992 || [];
                const purchaseSku = subformData.length > 0 ? (subformData[0]._widget_1681889355994 || '') : '';

                // 转换简道云数据格式为类似 orderSplitter 预期的一维对象用于处理
                const standardOrder = {
                    ...orderData,
                    po_number: poNumber,
                    quantity: parseInt(orderData._widget_1682229760644) || 1,
                    tracking: orderData._widget_1682230713348 || '',
                    item_number: orderData._widget_1681532075750 || '', // 产品SKU
                    purchase_sku: purchaseSku
                };

                // 提取面单附件数组
                if (orderData._widget_1688133134140 && Array.isArray(orderData._widget_1688133134140)) {
                    standardOrder.label_files = orderData._widget_1688133134140;
                }

                if (isPickUp && standardOrder.quantity > 1) {
                    await feishuBot.sendText(chatId, `📦 ${poNumber} 是自提订单且数量=${standardOrder.quantity}，准备进入拆单模式...`);
                    
                    try {
                        const subOrders = await orderSplitter.splitSingleOrder(standardOrder, standardOrder.quantity);
                        await feishuBot.sendText(chatId, `🔀 ${poNumber} 拆分为 ${subOrders.length} 个子订单`);

                        for (const subOrder of subOrders) {
                            const res = await pushToDoba(subOrder, true);
                            results.push({
                                po: subOrder.po_number,
                                isPickUp: true,
                                success: res.success,
                                error: res.error,
                                batchId: res.batchId
                            });
                        }
                    } catch (splitErr) {
                        console.error('Split error:', splitErr);
                        results.push({
                            po: poNumber,
                            isPickUp: true,
                            success: false,
                            error: `拆单失败: ${splitErr.message}`
                        });
                    }

                } else {
                    // 一件代发 或者 单件自提订单，直接推
                    console.log(`🚀 直接推单 ${poNumber} (PickUp: ${isPickUp})`);
                    const res = await pushToDoba(standardOrder, isPickUp);
                    results.push({
                        po: poNumber,
                        isPickUp,
                        success: res.success,
                        error: res.error,
                        batchId: res.batchId
                    });
                }
            }

            // 发送汇总
            let successCount = results.filter(r => r.success).length;
            let failCount = results.filter(r => !r.success).length;
            
            let reportMsg = `📊 推单执行完毕\n✅ 成功：${successCount} 分支订单\n❌ 失败：${failCount} 分支订单\n\n`;
            for (const r of results) {
                const icon = r.success ? '✅' : '❌';
                const kind = r.isPickUp ? '[自提]' : '[代发]';
                reportMsg += `${icon} ${r.po} ${kind} - ${r.success ? `成功 (${r.batchId})` : `失败 (${r.error})`}\n`;
            }

            await feishuBot.sendText(chatId, reportMsg);

        } catch (error) {
            console.error('Push DOBA error:', error);
            await feishuBot.sendText(chatId, `❌ 执行异常: ${error.message}`);
        }
    } else {
        await feishuBot.sendText(chatId, '🤖 欢迎使用 DOBA 订单对接助手\n\n用法: 推单 PO1,PO2');
    }
});

module.exports = router;
