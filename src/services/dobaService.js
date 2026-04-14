const axios = require('axios');
const { KJUR, hextob64, KEYUTIL } = require('jsrsasign');

class DobaService {
    constructor() {
        this.appKey = process.env.DOBA_APP_KEY;
        this.privateKey = process.env.DOBA_PRIVATE_KEY;
        this.baseUrl = process.env.DOBA_BASE_URL || 'https://openapi.doba.com';
    }

    /**
     * 生成请求头签名
     * @param {number} timestamp 
     * @returns {string} 
     */
    generateSign(timestamp) {
        if (!this.appKey || !this.privateKey) {
            throw new Error('DOBA_APP_KEY or DOBA_PRIVATE_KEY is missing');
        }
        const pvKeyPem = `-----BEGIN PRIVATE KEY-----\n${this.privateKey}\n-----END PRIVATE KEY-----`;
        const data = `appKey=${this.appKey}&signType=rsa2&timestamp=${timestamp}`;
        
        const rsa = KEYUTIL.getKey(pvKeyPem);
        const signature = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
        signature.init(rsa);
        signature.updateString(data);
        const signData = signature.sign();
        
        return hextob64(signData);
    }

    /**
     * 获取具有 DOBA Header 的 Axios 实例
     */
    getAxiosInstance() {
        const timestamp = Date.now();
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                'appKey': this.appKey,
                'signType': 'rsa2',
                'timestamp': timestamp.toString(),
                'sign': this.generateSign(timestamp),
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * 获取国家代码列表
     */
    async getCountryList(countryCode = null) {
        const client = this.getAxiosInstance();
        try {
            const endpoint = countryCode 
                ? `/api/region/doba/country/list?countryCode=${countryCode}` 
                : `/api/region/doba/country/list`;
            const res = await client.get(endpoint);
            this.checkResponse(res.data);
            return res.data.businessData.data;
        } catch (error) {
            console.error('DOBA getCountryList error:', error?.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 获取物流方式列表
     */
    async getShippingMethods() {
        const client = this.getAxiosInstance();
        try {
            const res = await client.get('/api/ship/list');
            this.checkResponse(res.data);
            return res.data.businessData.data;
        } catch (error) {
            console.error('DOBA getShippingMethods error:', error?.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 导入订单 (下单)
     */
    async importOrder(payload) {
        const client = this.getAxiosInstance();
        try {
            console.log('Sending DOBA Import OrderPayload:', JSON.stringify(payload, null, 2));
            const res = await client.post('/api/order/doba/importOrder', payload);
            this.checkResponse(res.data);
            return res.data.businessData;
        } catch (error) {
            console.error('DOBA importOrder error:', error?.response?.data || error.message);
            throw error;
        }
    }

    /**
     * 支付订单
     * default paymentMethodCode 7 for prepay balance
     */
    async submitPayment(encryptOrdBatchIds, paymentMethodCode = 7) {
        const client = this.getAxiosInstance();
        try {
            const payload = {
                encryptOrdBatchIds,
                paymentMethodCode
            };
            const res = await client.post('/api/pay/payment/doba/submit', payload);
            this.checkResponse(res.data);
            return res.data.businessData;
        } catch (error) {
            console.error('DOBA submitPayment error:', error?.response?.data || error.message);
            throw error;
        }
    }

    checkResponse(data) {
        if (data.responseCode !== '000000') {
            throw new Error(`DOBA API Error: ${data.responseCode} - ${data.responseMessage} | ${data.businessData?.businessStatus} - ${data.businessData?.businessMessage}`);
        }
    }
}

module.exports = new DobaService();
