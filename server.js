const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

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

// Resend configuration
const RESEND_CONFIG = {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || ''
};

// Get template code (A-F) based on rating and trial interest
function getTemplateCode(rating, tryProducts) {
    const ratingNum = parseInt(rating);
    const wantsTrial = tryProducts && tryProducts.toLowerCase().includes('yes');
    
    if (ratingNum === 5 && wantsTrial) return 'A';
    if ((ratingNum === 4 || ratingNum === 3) && wantsTrial) return 'B';
    if ((ratingNum === 2 || ratingNum === 1) && wantsTrial) return 'C';
    if (ratingNum === 5 && !wantsTrial) return 'D';
    if ((ratingNum === 4 || ratingNum === 3) && !wantsTrial) return 'E';
    if ((ratingNum === 2 || ratingNum === 1) && !wantsTrial) return 'F';
    
    return 'Unknown';
}

const app = express();
const PORT = process.env.PORT || 3000;

// Simple fetch wrapper using native http/https modules
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
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
    accessToken: '',
    tokenExpiresAt: 0  // Token expiration timestamp (ms)
};

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
        // Set expiration time (expire is in seconds, convert to ms and subtract 5 min buffer)
        const expireSeconds = result.expire || 7200;
        FEISHU_CONFIG.tokenExpiresAt = Date.now() + (expireSeconds - 300) * 1000;
        
        console.log('✓ Feishu access token obtained successfully');
        console.log(`   Token expires in: ${expireSeconds}s (at ${new Date(FEISHU_CONFIG.tokenExpiresAt).toLocaleString()})`);
        return result.tenant_access_token;
    } catch (error) {
        console.error('❌ Failed to get Feishu token:', error.message);
        return null;
    }
}

// Refresh token if needed
async function ensureAccessToken() {
    const now = Date.now();
    
    // Check if token is missing or expired
    if (!FEISHU_CONFIG.accessToken || now >= FEISHU_CONFIG.tokenExpiresAt) {
        console.log('🔑 [TOKEN] Token missing or expired, refreshing...');
        console.log(`   [TOKEN] Current time: ${new Date(now).toLocaleString()}`);
        console.log(`   [TOKEN] Token expires at: ${FEISHU_CONFIG.tokenExpiresAt ? new Date(FEISHU_CONFIG.tokenExpiresAt).toLocaleString() : 'N/A'}`);
        
        const token = await getFeishuAccessToken();
        if (!token) {
            throw new Error('Feishu access token not available. Check FEISHU_APP_ID and FEISHU_APP_SECRET.');
        }
    } else {
        const expiresIn = Math.round((FEISHU_CONFIG.tokenExpiresAt - now) / 1000);
        console.log(`🔑 [TOKEN] Using cached token (expires in ${expiresIn}s)`);
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
        '邮件模板 / Email Template': data.emailTemplate || '',
        '邮件发送状态 / Email Status': data.emailStatus || 'Pending',
        '日期 / Date': new Date().getTime()
    };
    
    console.log('📋 Creating Feishu record with fields:', JSON.stringify({
        emailTemplate: data.emailTemplate,
        emailStatus: data.emailStatus
    }));
    
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
    
    console.log('📋 Feishu create response:', JSON.stringify(result));
    console.log('🔍 [V3-FIX] Parsing response...');
    
    if (result.code !== 0) {
        throw new Error(`Feishu API error: ${result.msg}`);
    }
    
    // Direct extraction - V3 FIX
    let recordId = null;
    try {
        // Method 1: result.data.record.record_id
        if (result.data && result.data.record && result.data.record.record_id) {
            recordId = result.data.record.record_id;
            console.log('🔍 [V3-FIX] Found via result.data.record.record_id:', recordId);
        }
        // Method 2: result.data.record.id
        else if (result.data && result.data.record && result.data.record.id) {
            recordId = result.data.record.id;
            console.log('🔍 [V3-FIX] Found via result.data.record.id:', recordId);
        }
        // Method 3: result.data.record_id
        else if (result.data && result.data.record_id) {
            recordId = result.data.record_id;
            console.log('🔍 [V3-FIX] Found via result.data.record_id:', recordId);
        }
        // Method 4: result.data.id
        else if (result.data && result.data.id) {
            recordId = result.data.id;
            console.log('🔍 [V3-FIX] Found via result.data.id:', recordId);
        }
        else {
            console.error('🔍 [V3-FIX] Could not find recordId in response!');
            console.error('🔍 [V3-FIX] result.data =', JSON.stringify(result.data));
        }
    } catch (parseError) {
        console.error('🔍 [V3-FIX] Parse error:', parseError.message);
    }
    
    console.log('✅ [V3-FIX] Final recordId:', recordId);
    
    return { ...result, recordId: recordId };
}

// Update email status in Feishu Bitable
async function updateFeishuEmailStatus(recordId, emailTemplate, emailStatus) {
    try {
        const token = await ensureAccessToken();
        
        const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.appToken}/tables/${FEISHU_CONFIG.tableId}/records/${recordId}`;
        
        const fields = {};
        if (emailTemplate) {
            fields['邮件模板 / Email Template'] = emailTemplate;
        }
        if (emailStatus !== undefined) {
            fields['邮件发送状态 / Email Status'] = emailStatus;
        }
        
        console.log('   [UPDATE] URL:', url);
        console.log('   [UPDATE] Fields:', JSON.stringify(fields));
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: fields
            })
        });
        
        const result = await response.json();
        
        console.log('   [UPDATE] Response:', JSON.stringify(result));
        
        if (result.code !== 0) {
            console.error('❌ Failed to update Feishu email status:', result.msg);
        } else {
            console.log('✓ Updated Feishu email status:', emailStatus);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error updating Feishu email status:', error.message);
        console.error('   [UPDATE] Stack:', error.stack);
    }
}

// Send email using Resend API
async function sendEmail(to, subject, html) {
    if (!RESEND_CONFIG.apiKey) {
        console.log('⚠️  Resend API key not configured.');
        return null;
    }
    
    if (!RESEND_CONFIG.from) {
        console.log('⚠️  EMAIL_FROM not configured.');
        return null;
    }
    
    console.log('📮 Sending email via Resend...');
    console.log('   From:', RESEND_CONFIG.from);
    console.log('   To:', to);
    console.log('   Subject:', subject);
    
    const url = 'https://api.resend.com/emails';
    
    const data = {
        from: RESEND_CONFIG.from,
        to: to,
        subject: subject,
        html: html
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        // Check status code directly (custom fetch doesn't have response.ok)
        if (response.status === 200 && result.id) {
            console.log('✓ Email sent successfully via Resend:', result.id);
            return { messageId: result.id };
        } else {
            console.error('❌ Resend error:', result);
            throw new Error(`Resend API error: ${result.message || response.status}`);
        }
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        throw error;
    }
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
        
        // Get email template info and template code (A-F)
        const template = getEmailTemplate(fullName, orderNumber, rating, tryProducts);
        const templateName = template.subject;
        const templateCode = getTemplateCode(rating, tryProducts);
        
        console.log('📋 Template info:', {
            code: templateCode,
            subject: templateName.substring(0, 50) + '...'
        });
        
        // Save to Feishu Bitable IMMEDIATELY (with template code A-F, status Pending)
        const feishuResult = await createFeishuRecord({
            fullName,
            email,
            orderNumber,
            rating,
            experience,
            tryProducts,
            submitTime,
            emailTemplate: templateCode,
            emailStatus: 'Pending'
        });
        
        const recordId = feishuResult.recordId || feishuResult.data?.record_id;
        console.log('✓ Successfully saved to Feishu Bitable:', recordId);
        
        // Return success IMMEDIATELY (don't wait for email)
        res.json({
            success: true,
            message: 'Survey submitted successfully',
            data: {
                recordId: recordId,
                feishuSaved: true
            }
        });
        
        // Send email in background (after response is sent)
        setTimeout(async () => {
            console.log('📧 [BACKGROUND] Starting email process...');
            console.log('   Record ID:', recordId);
            console.log('   Recipient:', email);
            console.log('   Template Code:', templateCode);
            
            try {
                await sendEmail(email, templateName, template.html);
                
                console.log('✓ [BACKGROUND] Email sent successfully to:', email);
                console.log('   [BACKGROUND] Updating Feishu status to: Sent');
                
                // Update Feishu with success status
                const updateResult = await updateFeishuEmailStatus(recordId, '', 'Sent');
                console.log('   [BACKGROUND] Feishu update result:', JSON.stringify(updateResult));
            } catch (error) {
                console.error('❌ [BACKGROUND] Email failed:', error.message);
                console.error('   [BACKGROUND] Stack:', error.stack);
                console.log('   [BACKGROUND] Updating Feishu status to: Fail');
                
                // Update Feishu with failure status
                const updateResult = await updateFeishuEmailStatus(recordId, '', 'Fail');
                console.log('   [BACKGROUND] Feishu update result:', JSON.stringify(updateResult));
            }
        }, 500);
        
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
            console.log('⚠️  Feishu credentials not configured.');
        }
    } catch (error) {
        console.error('⚠️  Feishu initialization warning:', error.message);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('🚀 Survey server running! [V3-FIX]');
        console.log('🔧 [V3-FIX] RecordId extraction logic updated');
        console.log(`📍 Listening on: 0.0.0.0:${PORT}`);
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`📍 Health: http://localhost:${PORT}/api/health`);
        console.log(`📍 Form: http://localhost:${PORT}/index.html`);
        console.log('');
        if (FEISHU_CONFIG.appId && FEISHU_CONFIG.appSecret && FEISHU_CONFIG.accessToken) {
            console.log('✓ Feishu integration ready!');
        } else {
            console.log('⚠️  Feishu integration not ready');
        }
        if (RESEND_CONFIG.apiKey && RESEND_CONFIG.from) {
            console.log('✓ Resend email integration ready!');
        } else {
            console.log('⚠️  Resend not configured');
        }
        console.log('');
    });
}

init();
