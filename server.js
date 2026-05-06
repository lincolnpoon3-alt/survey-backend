const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static('public'));

// Feishu API Configuration
const FEISHU_CONFIG = {
    appToken: 'Tda7biISJaEWCvsLhjNcJ895nYe',
    tableId: 'tbl34FBJj2xRMWhD',
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    accessToken: ''
};

// Get Feishu tenant access token
async function getFeishuAccessToken() {
    if (!FEISHU_CONFIG.appId || !FEISHU_CONFIG.appSecret) {
        throw new Error('Feishu App ID and App Secret are required. Please set FEISHU_APP_ID and FEISHU_APP_SECRET environment variables.');
    }
    
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            app_id: FEISHU_CONFIG.appId,
            app_secret: FEISHU_CONFIG.appSecret
        })
    });
    
    const result = await response.json();
    
    if (result.code !== 0) {
        throw new Error(`Feishu auth error: ${result.msg}`);
    }
    
    FEISHU_CONFIG.accessToken = result.tenant_access_token;
    console.log('✓ Feishu access token obtained successfully');
    return result.tenant_access_token;
}

// Refresh token if needed
async function ensureAccessToken() {
    if (!FEISHU_CONFIG.accessToken) {
        await getFeishuAccessToken();
    }
    return FEISHU_CONFIG.accessToken;
}

// Create record in Feishu Bitable
async function createFeishuRecord(data) {
    const token = await ensureAccessToken();
    
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.appToken}/tables/${FEISHU_CONFIG.tableId}/records`;
    
    const fields = {
        '姓名 / Name': data.fullName,
        '邮箱 / Email': data.email,
        '订单号 / Order Number': data.orderNumber,
        '满意度评分 / Rate your purchase (5 = fully satisfied)': data.rating,
        '产品评价 / Review the product': data.experience,
        '是否愿意试用新产品 / Would you be willing to accept a free trial of our new product?': data.tryProducts,
        '日期 / Date': new Date().getTime()
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: fields
        })
    });
    
    const result = await response.json();
    
    if (result.code !== 0) {
        throw new Error(`Feishu API error: ${result.msg}`);
    }
    
    return result;
}

// API endpoint for form submission
app.post('/api/submit', async (req, res) => {
    try {
        const { fullName, email, orderNumber, rating, experience, tryProducts, submitTime } = req.body;
        
        // Validate required fields
        if (!fullName || !email || !orderNumber || !rating || !experience || !tryProducts) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'All fields are required'
            });
        }
        
        console.log('📝 Received survey submission:', {
            fullName,
            email,
            orderNumber,
            rating,
            experience: experience.substring(0, 50) + '...',
            tryProducts
        });
        
        // Save to Feishu Bitable
        const feishuResult = await createFeishuRecord({
            fullName,
            email,
            orderNumber,
            rating,
            experience,
            tryProducts,
            submitTime
        });
        
        console.log('✓ Successfully saved to Feishu Bitable:', feishuResult.data.record_id);
        
        // Return success
        res.json({
            success: true,
            message: 'Survey submitted successfully',
            data: {
                recordId: feishuResult.data.record_id,
                feishuSaved: true
            }
        });
        
    } catch (error) {
        console.error('❌ Submission error:', error.message);
        res.status(500).json({
            error: 'Submission failed',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        config: {
            feishuConfigured: !!(FEISHU_CONFIG.appId && FEISHU_CONFIG.appSecret),
            hasAccessToken: !!FEISHU_CONFIG.accessToken,
            bitableUrl: `https://tcnwu0yb07rj.feishu.cn/base/${FEISHU_CONFIG.appToken}?table=${FEISHU_CONFIG.tableId}`
        }
    });
});

// Initialize on startup
async function init() {
    try {
        if (FEISHU_CONFIG.appId && FEISHU_CONFIG.appSecret) {
            await getFeishuAccessToken();
        } else {
            console.log('⚠️  Feishu credentials not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET environment variables.');
            console.log('');
            console.log('To get your Feishu credentials:');
            console.log('1. Go to https://open.feishu.cn/');
            console.log('2. Create a self-built app (自建应用)');
            console.log('3. Get App ID and App Secret from app credentials');
            console.log('4. Enable permissions: bitable:app (write access)');
            console.log('5. Set environment variables:');
            console.log('   export FEISHU_APP_ID=your_app_id');
            console.log('   export FEISHU_APP_SECRET=your_app_secret');
        }
    } catch (error) {
        console.error('Failed to initialize Feishu:', error.message);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('🚀 Survey server running!');
        console.log(`📍 Listening on: 0.0.0.0:${PORT}`);
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`📍 Health: http://localhost:${PORT}/api/health`);
        console.log(`📍 Form: http://localhost:${PORT}/index.html`);
        console.log('');
        console.log('To use in Shopify:');
        console.log('1. Update shopify-survey.html with your server URL');
        console.log('2. Copy the HTML to Shopify page editor');
    });
}

init();
