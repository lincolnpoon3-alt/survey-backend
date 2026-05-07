const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const nodemailer = require('nodemailer');

console.log('🔍 Loading email templates...');
let getEmailTemplate;
try {
    const emailTemplates = require('./email-templates');
    getEmailTemplate = emailTemplates.getEmailTemplate;
    console.log('✓ Email templates loaded successfully');
} catch (error) {
    console.error('❌ Failed to load email-templates.js:', error.message);
    getEmailTemplate = () => ({ subject: 'Error', html: '<p>Email template error</p>' });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Simple fetch wrapper using native http/https modules
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const lib = isHttps ? https : http;
        
        const requestOptions = {
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = lib.request(url, requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    json: () => Promise.resolve(JSON.parse(data)),
                    text: () => Promise.resolve(data),
                    status: res.statusCode
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

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

// Email Configuration
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || ''
};

// Create email transporter
function createEmailTransporter() {
    console.log('📧 Checking email config...');
    console.log('   SMTP_HOST:', EMAIL_CONFIG.host ? `'${EMAIL_CONFIG.host}'` : 'NOT SET');
    console.log('   SMTP_PORT:', EMAIL_CONFIG.port);
    console.log('   SMTP_USER:', EMAIL_CONFIG.user ? `'${EMAIL_CONFIG.user}'` : 'NOT SET');
    console.log('   SMTP_PASS:', EMAIL_CONFIG.pass ? '*** SET ***' : 'NOT SET');
    console.log('   EMAIL_FROM:', EMAIL_CONFIG.from ? `'${EMAIL_CONFIG.from}'` : 'NOT SET');
    console.log('   secure:', EMAIL_CONFIG.secure);
    
    if (!EMAIL_CONFIG.host || !EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
        console.log('⚠️  Email not configured. Missing required variables.');
        return null;
    }
    
    return nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: {
            user: EMAIL_CONFIG.user,
            pass: EMAIL_CONFIG.pass
        }
    });
}

// Send email function
async function sendEmail(to, subject, html) {
    const transporter = createEmailTransporter();
    
    if (!transporter) {
        console.log('⚠️  Email transporter not configured, skipping email send.');
        return null;
    }
    
    try {
        const info = await transporter.sendMail({
            from: EMAIL_CONFIG.from,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log('✓ Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        throw error;
    }
}

// Get Feishu tenant access token
async function getFeishuAccessToken() {
    console.log('🔑 Attempting to get Feishu token...');
    console.log('   App ID length:', FEISHU_CONFIG.appId ? FEISHU_CONFIG.appId.length : 0);
    console.log('   App Secret length:', FEISHU_CONFIG.appSecret ? FEISHU_CONFIG.appSecret.length : 0);
    
    if (!FEISHU_CONFIG.appId || !FEISHU_CONFIG.appSecret) {
        console.log('⚠️  Feishu credentials not set. Skipping token refresh.');
        return null;
    }
    
    try {
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
        
        console.log('📋 Feishu auth response:', JSON.stringify(result));
        
        if (result.code !== 0) {
            console.error('❌ Feishu auth error:', result.msg, 'Code:', result.code);
            return null;
        }
        
        FEISHU_CONFIG.accessToken = result.tenant_access_token;
        console.log('✓ Feishu access token obtained successfully');
        return result.tenant_access_token;
    } catch (error) {
        console.error('❌ Failed to get Feishu token:', error.message);
        return null;
    }
}

// Refresh token if needed
async function ensureAccessToken() {
    if (!FEISHU_CONFIG.accessToken) {
        const token = await getFeishuAccessToken();
        if (!token) {
            throw new Error('Feishu access token not available. Check FEISHU_APP_ID and FEISHU_APP_SECRET.');
        }
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
        
        // Send email based on rating and trial interest
        let emailSent = false;
        let emailError = null;
        try {
            console.log('📧 Preparing to send email...');
            console.log('   Recipient:', email);
            console.log('   Rating:', rating);
            console.log('   Trial interest:', tryProducts);
            
            const template = getEmailTemplate(fullName, orderNumber, rating, tryProducts);
            console.log('   Email subject:', template.subject);
            
            await sendEmail(email, template.subject, template.html);
            emailSent = true;
            console.log('✓ Email sent to:', email, 'with template for rating:', rating, 'trial:', tryProducts);
        } catch (error) {
            emailError = error.message;
            console.error('❌ Failed to send email:', error.message);
            console.error('   Stack:', error.stack);
        }
        
        // Return success
        res.json({
            success: true,
            message: 'Survey submitted successfully',
            data: {
                recordId: feishuResult.data.record_id,
                feishuSaved: true,
                emailSent: emailSent,
                emailError: emailError
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
            console.log('📋 Feishu credentials found, attempting to get access token...');
            await getFeishuAccessToken();
        } else {
            console.log('⚠️  Feishu credentials not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET environment variables.');
            console.log('');
            console.log('To get your Feishu credentials:');
            console.log('1. Go to https://open.feishu.cn/');
            console.log('2. Create a self-built app (自建应用)');
            console.log('3. Get App ID and App Secret from app credentials');
            console.log('4. Enable permissions: bitable:app (write access)');
            console.log('5. Set environment variables in Railway Variables tab');
        }
    } catch (error) {
        console.error('⚠️  Feishu initialization warning (server will still start):', error.message);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('🚀 Survey server running!');
        console.log(`📍 Listening on: 0.0.0.0:${PORT}`);
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`📍 Health: http://localhost:${PORT}/api/health`);
        console.log(`📍 Form: http://localhost:${PORT}/index.html`);
        console.log('');
        if (FEISHU_CONFIG.appId && FEISHU_CONFIG.appSecret && FEISHU_CONFIG.accessToken) {
            console.log('✓ Feishu integration ready!');
        } else {
            console.log('⚠️  Feishu integration not ready - form submissions will fail');
        }
        if (EMAIL_CONFIG.host && EMAIL_CONFIG.user && EMAIL_CONFIG.pass) {
            console.log('✓ Email integration ready!');
        } else {
            console.log('⚠️  Email not configured - set SMTP_HOST, SMTP_USER, SMTP_PASS in Railway Variables');
        }
        console.log('');
    });
}

init();
