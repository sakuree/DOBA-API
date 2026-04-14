const express = require('express');
const feishuHandler = require('./feishuHandler');

const app = express();

app.use(express.json({ limit: '10mb' }));

app.use('/feishu', feishuHandler);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'doba-api',
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error('Express Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`\n🚀 DOBA-API Backend Service Started`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   Feishu Webhook: http://localhost:${PORT}/feishu/event`);
    console.log(`   DOBA APP KEY: ${process.env.DOBA_APP_KEY ? '✅' : '❌'}`);
    console.log(`   JIANDAO API: ${process.env.JD_API_KEY ? '✅' : '❌'}`);
    console.log('');
});
