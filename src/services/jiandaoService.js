const axios = require('axios');

class JiandaoService {
    constructor() {
        this.apiKey = process.env.JD_API_KEY;
        this.appId = process.env.JD_APP_ID;
        this.orderEntryId = process.env.JD_FORM_ORDER;
        this.baseUrl = process.env.JD_BASE_URL || 'https://api.jiandaoyun.com';
    }

    /**
     * 查询 HomeDepot 订单 (销售订单)
     * @param {string[]} poNumbers 
     */
    async queryOrdersByPos(poNumbers) {
        if (!this.apiKey || !this.appId || !this.orderEntryId) {
            throw new Error('Jiandao config missing');
        }

        const url = `${this.baseUrl}/api/v5/app/entry/data/list`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        const result = [];

        // 简道云一次最多返回 100 条数据，此处简单循环单独查 (或使用 in 查询)
        // 使用 in 过滤可以批量查:
        const payload = {
            app_id: this.appId,
            entry_id: this.orderEntryId,
            filter: {
                rel: 'and',
                cond: [
                    {
                        field: '_widget_1681532075748', // PO Number
                        method: 'in',
                        value: poNumbers.join(',') // in requires comma separated string or array ? Wait, 'in' in Jiandao accepts array
                    }
                ]
            },
            limit: 100
        };

        try {
            // Jiandaoyun 'in' filter accepts array
            payload.filter.cond[0].value = poNumbers;

            const res = await axios.post(url, payload, { headers });
            
            if (res.data && res.data.data) {
                result.push(...res.data.data);
            }
            return result;
        } catch (err) {
            console.error('Jiandao query error:', err?.response?.data || err.message);
            throw err;
        }
    }

    /**
     * 更新订单状态，触发智能助手
     */
    async updateOrder(dataId, updateData) {
        const url = `${this.baseUrl}/api/v5/app/entry/data/update`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        const payload = {
            app_id: this.appId,
            entry_id: this.orderEntryId,
            data_id: dataId,
            data: updateData,
            is_start_trigger: true // 铁律: 必须加，以触发简道云智能助手
        };

        try {
            const res = await axios.post(url, payload, { headers });
            return res.data;
        } catch (err) {
            console.error(`Jiandao update error (DataId: ${dataId}):`, err?.response?.data || err.message);
            throw err;
        }
    }
}

module.exports = new JiandaoService();
