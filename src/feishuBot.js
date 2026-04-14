const axios = require('axios');

/**
 * 飞书机器人服务
 */
class FeishuBotService {
    constructor() {
        this.appId = process.env.FEISHU_APP_ID;
        this.appSecret = process.env.FEISHU_APP_SECRET;
        this.baseUrl = 'https://open.feishu.cn/open-apis';
        this._token = null;
        this._tokenExpire = 0;
    }

    async getToken() {
        if (this._token && Date.now() < this._tokenExpire) {
            return this._token;
        }

        if (!this.appId || !this.appSecret) {
            console.warn('⚠️ FEISHU_APP_ID or FEISHU_APP_SECRET missing');
            return null;
        }

        try {
            const res = await axios.post(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
                app_id: this.appId,
                app_secret: this.appSecret,
            });

            if (res.data.code !== 0) {
                throw new Error(`Feishu token fetch failed: ${res.data.msg}`);
            }

            this._token = res.data.tenant_access_token;
            this._tokenExpire = Date.now() + (res.data.expire - 300) * 1000;
            return this._token;
        } catch (error) {
            console.error('Feishu getToken error:', error.message);
            throw error;
        }
    }

    async sendText(chatId, text) {
        const token = await this.getToken();
        if (!token) {
            console.log(`[Mock Feishu Msg -> ${chatId}]:`, text);
            return;
        }

        try {
            const res = await axios.post(`${this.baseUrl}/im/v1/messages?receive_id_type=chat_id`, {
                receive_id: chatId,
                msg_type: 'text',
                content: JSON.stringify({ text }),
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.code !== 0) {
                console.error('Feishu send text failed:', res.data.msg);
            }
            return res.data;
        } catch (error) {
            console.error('Feishu sendText error:', error.message);
        }
    }
}

module.exports = new FeishuBotService();
