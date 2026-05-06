# Customer Survey System - Deployment Guide

## Overview

This system consists of:
1. **Frontend**: HTML survey form (`index.html`)
2. **Backend**: Node.js server (`server.js`) that handles:
   - Form submission processing
   - Feishu Bitable data storage
   - Confirmation email sending

## File Structure

```
survey/
├── public/
│   └── index.html          # Survey form (frontend)
├── server.js               # Backend server
├── package.json            # Node.js dependencies
├── package-lock.json       # Locked dependencies
├── README.md               # This file
├── RAILWAY.md              # Railway deployment guide
├── railway.json            # Railway configuration
├── setup.sh                # Quick setup script
├── .env.example            # Environment variables template
├── .env                    # Local environment (DO NOT commit)
├── .gitignore              # Git ignore rules
├── .nvmrc                  # Node.js version
├── shopify-complete.html   # Shopify integration (complete version)
└── shopify-survey.html     # Shopify integration (survey version)
```

## Feishu Bitable Configuration

**Table**: Fuzzymilky 私域统计表  
**URL**: https://tcnwu0yb07rj.feishu.cn/base/Tda7biISJaEWCvsLhjNcJ895nYe?table=tbl34FBJj2xRMWhD  
**app_token**: `Tda7biISJaEWCvsLhjNcJ895nYe`  
**table_id**: `tbl34FBJj2xRMWhD`

### Field Mapping

| Survey Field | Bitable Field |
|--------------|---------------|
| Your full name | 姓名 / Name |
| Email address | 邮箱 / Email |
| Amazon order number | 订单号 / Order Number |
| Rating (1-5) | 满意度评分 / Rate your purchase |
| Experience | 产品评价 / Review the product |
| Try new products | 是否愿意试用新产品 |
| Submit Time | 日期 / Date |

## Prerequisites

- Node.js 18+ installed
- Feishu app with Bitable permissions
- SMTP email server credentials (optional, for email sending)

## Setup Steps

### 1. Install Dependencies

```bash
cd survey
npm install
```

### 2. Configure Feishu Access Token

You need to obtain a Feishu API access token:

1. Go to [Feishu Open Platform](https://open.feishu.cn/)
2. Create a new app or use existing one
3. Enable permissions:
   - `bitable:app` - Read/write Bitable data
4. Get your app credentials (App ID, App Secret)
5. Generate access token or use app credentials

Set environment variable:
```bash
export FEISHU_ACCESS_TOKEN="your_access_token_here"
```

### 3. Configure Email (Optional)

For sending confirmation emails, set these environment variables:

```bash
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"
export SMTP_SECURE="false"
export SMTP_USER="your_email@example.com"
export SMTP_PASS="your_password"
export EMAIL_FROM="noreply@example.com"
```

### 4. Move Frontend File

For production, move `index.html` to `public/` folder:

```bash
mkdir -p public
mv index.html public/
```

Update the `API_ENDPOINT` in `public/index.html` if needed.

### 5. Run the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 6. Access the Survey

Open your browser and go to:
```
http://localhost:3000
```

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `FEISHU_ACCESS_TOKEN` | Yes* | Feishu API access token |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_SECURE` | No | Use SSL/TLS (true/false) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `EMAIL_FROM` | No | Sender email address |

*Required for Feishu integration to work

## Testing

### Test Health Check
```bash
curl http://localhost:3000/api/health
```

### Test Form Submission
```bash
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "orderNumber": "123-4567890-1234567",
    "rating": "5",
    "experience": "Great product!",
    "tryProducts": "Yes, I'\''d love to"
  }'
```

## Production Deployment

### Option 1: Deploy to VPS/Server

1. Upload files to server
2. Install Node.js and dependencies
3. Set environment variables
4. Use PM2 or systemd to keep server running
5. Configure reverse proxy (Nginx/Apache)
6. Set up SSL certificate (Let's Encrypt)

### Option 2: Deploy to Cloud Platform

**Heroku:**
```bash
heroku create survey-app
heroku config:set FEISHU_ACCESS_TOKEN=xxx
heroku config:set SMTP_HOST=xxx
# ... other config
git push heroku main
```

**Vercel/Netlify:**
- Use serverless function for backend
- Deploy frontend as static site

### Option 3: Use Feishu Self-Built App

You can embed this survey directly in Feishu as a self-built app.

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Never commit credentials to git
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Input Validation**: Backend validates all inputs
5. **CORS**: Configure CORS for your domain only

## Troubleshooting

### Feishu API Error
- Check access token is valid and not expired
- Verify app has correct permissions
- Check app_token and table_id are correct

### Email Not Sending
- Verify SMTP credentials
- Check firewall allows SMTP port
- Some email providers require app-specific passwords

### Form Not Submitting
- Check browser console for errors
- Verify API_ENDPOINT in index.html is correct
- Check server logs for errors

## Support

For issues or questions, check:
- Server logs for error messages
- Feishu Open Platform documentation
- Node.js and Express documentation
